import { BehaviorSubject, Observable} from 'rxjs'
import { flatMap, filter } from 'rxjs/operators'

import { AbstractChat } from './abstract-chat'
import { User, DataProvider } from './user'
import { UserEvent } from '../events/user-event'
import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { Sendable } from '../message/sendable'
import { Paths } from '../firebase/service/paths'
import { EventType } from '../events/event-type'
import { FireStream } from '../firestream'
import { Path } from '../firebase/service/path'
import { RoleType } from '../types/role-type'
import { InvitationType } from '../types/invitation-type'
import { FireStreamUser } from '../namespace/firestream-user'
import { TypingStateType } from '../types/typing-state-type'
import { TypingState } from '../message/typing-state'
import { TextMessage } from '../message/text-message'
import { Message } from '../message/message'
import { MessageStreamFilter } from '../filter/message-stream-filter'
import { Consumer } from '../interfaces/consumer'
import { IJson } from '../interfaces/json'
import { IChat } from '../interfaces/chat'
import { Meta } from './meta'

export class Chat extends AbstractChat implements IChat {

    protected id: string
    protected joined?: Date
    protected meta = new Meta()

    protected users = new Array<User>()
    protected userEvents = new MultiQueueSubject<UserEvent>()

    protected nameChangedEvents = new BehaviorSubject<string>('')
    protected imageURLChangedEvents = new BehaviorSubject<string>('')
    protected customDataChangedEvents = new BehaviorSubject<IJson>({})

    constructor(id: string, joined?: Date, meta?: Meta) {
        super()
        this.id = id
        this.joined = joined || this.joined
        this.meta = meta || this.meta
    }

    getId(): string {
        return this.id
    }

    async connect(): Promise<void> {

        console.log('Connect to chat:', this.id)        

        // If delivery receipts are enabled, send the delivery receipt
        if (this.config.deliveryReceiptsEnabled) {
            this.sm.add(this.getSendableEvents()
                    .getMessages()
                    .allEvents()
                    .pipe(filter(MessageStreamFilter.notFromMe()))
                    .pipe(flatMap(this.markReceived))
                    .subscribe(this))
        }

        this.sm.add(this.listChangeOn(Paths.chatUsersPath(this.id)).subscribe(listEvent => {
            const userEvent = UserEvent.from(listEvent)
            if (userEvent.type === EventType.Added) {
                this.users.push(userEvent.user)
            }
            if (userEvent.type === EventType.Removed) {
                this.users = this.users.filter(user => !user.equals(userEvent.user))
            }
            this.userEvents.next(userEvent)
        }, this.error))

        // Handle name and image change
        const chatHandler = FireStream.shared().getFirebaseService().chat
        this.sm.add(chatHandler.metaOn(Paths.chatMetaPath(this.id)).subscribe(newMeta => {
            if (!newMeta) return
            if (newMeta.getName() && newMeta.getName() != this.meta.getName()) {
                this.meta.setName(newMeta.getName())
                this.nameChangedEvents.next(newMeta.getName())
            }
            if (newMeta.getImageURL() && newMeta.getImageURL() != this.meta.getImageURL()) {
                this.meta.setImageURL(newMeta.getImageURL())
                this.imageURLChangedEvents.next(newMeta.getImageURL())
            }
            this.meta.setCreated(newMeta.getCreated() || this.meta.getCreated())
        }, this.error))

        await super.connect()
    }

    leave(): Promise<void> {
        return this.removeUser(User.currentUser()).then(this.disconnect)
    }

    getName(): string {
        return this.meta.getName()
    }

    getCustomData(): IJson {
        return this.meta.getData();
    }

    async setCustomData(data: IJson): Promise<void> {
        if (!RoleType.admin().test(FireStream.shared().currentUser())) {
            throw this.adminPermissionRequired()
        } else {
            const newMeta = this.meta.copy()
            newMeta.setData(data)
            await FireStream.shared().getFirebaseService().chat.updateMeta(this.path(), newMeta.toData())
            this.meta.setData(data)
        }
    }

    async setName(name: string): Promise<void> {
        if (!RoleType.admin().test(FireStream.shared().currentUser())) {
            throw this.adminPermissionRequired()
        } else if (this.meta.getName() !== name) {
            const newMeta = this.meta.copy()
            newMeta.setName(name)
            await FireStream.shared().getFirebaseService().chat.updateMeta(this.path(), newMeta.toData(false))
            this.meta.setName(name)
        }
    }

    getImageURL(): string {
        return this.meta.getImageURL()
    }

    async setImageURL(url: string): Promise<void> {
        if (!RoleType.admin().test(FireStream.shared().currentUser())) {
            throw this.adminPermissionRequired()
        } else if (this.meta.getImageURL() !== url) {
            const newMeta = this.meta.copy()
            newMeta.setImageURL(url)
            return FireStream.shared().getFirebaseService().chat.updateMeta(this.path(), newMeta.toData(false))
        }
    }

    getUsers(): User[] {
        return this.users
    }

    getFireStreamUsers(): Array<FireStreamUser> {
        const firestreamUsers = new Array<FireStreamUser>()
        for (const user of this.users) {
            firestreamUsers.push(FireStreamUser.fromUser(user))
        }
        return firestreamUsers
    }

    addUser(sendInvite: boolean, user: User): Promise<void>
    addUser(path: Path, dataProvider: DataProvider, user: User): Promise<void>
    async addUser(arg1: boolean | Path, arg2: User | DataProvider, arg3?: User): Promise<void> {
        if (typeof arg1 === 'boolean' && arg2 instanceof User) {
            return this.addUsers(arg1, [arg2])
        } else if (arg1 instanceof Path && !(arg2 instanceof User) && arg3 instanceof User) {
            return super.addUser(arg1, arg2, arg3)
        }
    }

    addUsers(sendInvite: boolean, users: User[]): Promise<void>
    addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void>
    async addUsers(arg1: boolean | Path, arg2?: User[] | DataProvider, arg3?: User[]): Promise<void> {
        if (typeof arg1 === 'boolean' && Array.isArray(arg2)) {
            await super.addUsers(Paths.chatUsersPath(this.id), User.roleTypeDataProvider(), arg2)
            if (arg1) {
                this.inviteUsers(arg2)
            }
            this.users.push(...arg2)
        }
         else if (typeof arg1 !== 'boolean' && arg2 && !Array.isArray(arg2) && arg3) {
            return super.addUsers(arg1, arg2, arg3)
        }
    }

    updateUser(user: User): Promise<void>
    updateUser(path: Path, dataProvider: DataProvider, user: User): Promise<void>
    updateUser(arg1: Path | User, arg2?: DataProvider, arg3?: User): Promise<void> {
        return super.updateUser(Paths.chatUsersPath(this.id), User.roleTypeDataProvider(), arg3 || (arg1 as User))
    }

    updateUsers(users: User[]): Promise<void>
    updateUsers(path: Path, dataProvider: DataProvider, user: User[]): Promise<void>
    updateUsers(arg1: Path | User[], arg2?: DataProvider, arg3?: User[]): Promise<void> {
        return super.updateUsers(Paths.chatUsersPath(this.id), User.roleTypeDataProvider(), arg3 || (arg1 as User[]))
    }

    removeUser(user: User): Promise<void>
    removeUser(path: Path, user: User): Promise<void>
    removeUser(arg1: User | Path, arg2?: User): Promise<void> {
        return super.removeUser(Paths.chatUsersPath(this.id), arg2 || (arg1 as User))
    }

    removeUsers(users: User[]): Promise<void>
    removeUsers(path: Path, users: User[]): Promise<void>
    removeUsers(arg1: User[] | Path, arg2?: User[]): Promise<void> {
        return super.removeUsers(Paths.chatUsersPath(this.id), arg2 || (arg1 as User[]))
    }

    async inviteUsers(users: User[]): Promise<void> {
        const promises = new Array<Promise<void>>()
        for (const user of users) {
            if (!user.isMe()) {
                promises.push(FireStream.shared().sendInvitation(user.id, InvitationType.chat(), this.id).then())
            }
        }
        await Promise.all(promises)
    }

    getUsersForRoleType(roleType: RoleType): User[] {
        const result = new Array<User>()
        for (const user of this.users) {
            if (user.roleType?.equals(roleType)) {
                result.push(user)
            }
        }
        return result
    }

    setRole(user: User, roleType: RoleType): Promise<void> {
        user.roleType = roleType
        return this.updateUser(user)
    }

    getRoleTypeForUser(theUser: User): RoleType {
        for (const user of this.users) {
            if (user.equals(theUser) && user.roleType) {
                return user.roleType
            }
        }
        return RoleType.none()
    }

    getNameChangeEvents(): Observable<string> {
        return this.nameChangedEvents.asObservable()
    }

    getImageURLChangeEvents(): Observable<string> {
        return this.imageURLChangedEvents.asObservable()
    }

    getCustomDataChangedEvents(): Observable<IJson> {
        return this.customDataChangedEvents.asObservable()
    }

    getUserEvents(): MultiQueueSubject<UserEvent> {
        return this.userEvents
    }

    sendMessageWithBody(body: { [key: string]: any }, newId?: Consumer<string>): Promise<void> {
        return this.send(new Message(body), newId)
    }

    sendMessageWithText(text: string, newId?: Consumer<string>): Promise<void> {
        return this.send(new TextMessage(text), newId)
    }

    sendTypingIndicator(type: TypingStateType, newId?: Consumer<string>): Promise<void> {
        return this.send(new TypingState(type), newId)
    }

    sendDeliveryReceipt(type: DeliveryReceiptType, messageId: string, newId?: Consumer<string>): Promise<void> {
        return this.send(new DeliveryReceipt(type, messageId), newId)
    }

    send(sendable: Sendable, newId?: Consumer<string>): Promise<void> {
        return this.sendToPath(Paths.chatMessagesPath(this.id), sendable, newId)
    }

    markReceived(message: Message): Promise<void> {
        return this.sendDeliveryReceipt(DeliveryReceiptType.received(), message.id)
    }

    markRead(message: Message): Promise<void> {
        return this.sendDeliveryReceipt(DeliveryReceiptType.read(), message.id)
    }

    protected getMyRoleType(): RoleType {
        return this.getRoleTypeForUser(FireStream.shared().currentUser())
    }

    equals(chat: any): boolean {
        if (chat instanceof Chat) {
            return this.id === chat.id
        }
        return false
    }

    protected setMeta(meta: Meta) {
        this.meta = meta
    }

    path(): Path {
        return Paths.chatPath(this.id)
    }

    protected messagesPath(): Path {
        return Paths.chatMessagesPath(this.id)
    }

    protected ownerPermissionRequired(): Error {
        return new Error('owner_permission_required')
    }

    protected adminPermissionRequired(): Error {
        return new Error('admin_permission_required')
    }

    protected memberPermissionRequired(): Error {
        return new Error('member_permission_required')
    }

    static async create(name: string, imageURL: string, users: User[]): Promise<Chat> {
        const data = Meta.with(name, imageURL).toData(true)
        const chatId = await FireStream.shared().getFirebaseService().chat.add(Paths.chatsPath(), data)
        const chat = new Chat(chatId, undefined, new Meta(name, imageURL))

        // Make sure the current user is the owner
        const usersToAdd = users.filter(user => !user.equals(User.currentUser()))
        usersToAdd.push(User.currentUser(RoleType.owner()))

        await chat.addUsers(true, usersToAdd)
        await chat.inviteUsers(users)
        return chat
    }

}
