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
import { Keys } from '../firebase/service/keys'
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

export class Chat extends AbstractChat {

    protected id: string
    protected joined?: Date
    protected meta = new Chat.Meta()

    protected users = new Array<User>()
    protected userEvents = new MultiQueueSubject<UserEvent>()

    protected nameStream = new BehaviorSubject<string>('')
    protected imageURLStream = new BehaviorSubject<string>('')

    constructor(id: string, joined?: Date, meta?: Chat.Meta) {
        super()
        this.id = id
        this.joined = joined || this.joined
        this.meta = meta || this.meta
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
            if (newMeta.name && newMeta.name != this.meta.name) {
                this.meta.name = newMeta.name
                this.nameStream.next(newMeta.name)
            }
            if (newMeta.imageURL && newMeta.imageURL != this.meta.imageURL) {
                this.meta.imageURL = newMeta.imageURL
                this.imageURLStream.next(newMeta.imageURL)
            }
            this.meta.created = newMeta.created || this.meta.created
        }, this.error))

        await super.connect()
    }

    messagesPath(): Path {
        return Paths.chatMessagesPath(this.id)
    }

    async setName(name: string): Promise<void> {
        if (this.meta.name === name) {
            return Promise.resolve()
        } else {
            const newMeta = this.meta.copy()
            newMeta.name = name
            await FireStream.shared().getFirebaseService().chat.updateMeta(this.path(), newMeta.toData(false))
            this.meta.name = name
        }
    }

    setImageURL(url: string): Promise<void> {
        if (this.meta.imageURL === url) {
            return Promise.resolve()
        } else {
            const newMeta = this.meta.copy()
            newMeta.imageURL = url
            return FireStream.shared().getFirebaseService().chat.updateMeta(this.path(), newMeta.toData(false))
        }
    }

    static async create(name: string, imageURL: string, users: User[]): Promise<Chat> {
        const data = Chat.Meta.with(name, imageURL).toData(true)
        const chatId = await FireStream.shared().getFirebaseService().chat.add(Paths.chatsPath(), data)
        const chat = new Chat(chatId, undefined, new Chat.Meta(name, imageURL))

        // Make sure the current user is the owner
        const usersToAdd = users.filter(user => !user.equals(User.currentUser()))
        usersToAdd.push(User.currentUser(RoleType.owner()))

        await chat.addUsers(usersToAdd)
        await chat.inviteUsers(users)
        return chat
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

    addUsers(users: User[]): Promise<void>
    addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void>
    addUsers(arg1: Path | User[], arg2?: DataProvider, arg3?: User[]): Promise<void> {
        return super.addUsers(Paths.chatUsersPath(this.id), User.roleTypeDataProvider(),  arg3 || (arg1 as User[]))
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

    getId(): string {
        return this.id
    }

    send(sendable: Sendable, newId?: Consumer<string>): Promise<void> {
        return this.sendToPath(Paths.chatMessagesPath(this.id), sendable, newId)
    }

    leave(): Promise<void> {
        return this.removeUser(User.currentUser()).then(this.disconnect)
    }

    /**
     * Send a delivery receipt to a user. If delivery receipts are enabled,
     * a 'received' status will be returned as soon as a message is delivered
     * and then you can then manually send a 'read' status when the user
     * actually reads the message
     * @param type - the status getBodyType
     * @return - subscribe to get a completion, error update from the method
     */
    sendDeliveryReceipt(type: DeliveryReceiptType, messageId: string, newId?: Consumer<string>): Promise<void> {
        return this.send(new DeliveryReceipt(type, messageId), newId)
    }

    markReceived(message: Message): Promise<void> {
        return this.sendDeliveryReceipt(DeliveryReceiptType.received(), message.id)
    }

    markRead(message: Message): Promise<void> {
        return this.sendDeliveryReceipt(DeliveryReceiptType.read(), message.id)
    }

    /**
     * Send a typing indicator update to a user. This should be sent when the user
     * starts or stops typing
     * @param type - the status getBodyType
     * @return - subscribe to get a completion, error update from the method
     */
    sendTypingIndicator(type: TypingStateType, newId?: Consumer<string>): Promise<void> {
        return this.send(new TypingState(type), newId)
    }

    sendMessageWithText(text: string, newId?: Consumer<string>): Promise<void> {
        return this.send(new TextMessage(text), newId)
    }

    sendMessageWithBody(body: { [key: string]: any }, newId?: Consumer<string>): Promise<void> {
        return this.send(new Message(body), newId)
    }

    getRoleTypeForUser(userId: string): RoleType | undefined {
        for (const user of this.users) {
            if (user.id === userId) {
                return user.roleType
            }
        }
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

    /**
     * Update the role for a user - whether you can do this will
     * depend childOn your admin level
     * @param user to change role
     * @param roleType new role
     * @return completion
     */
    setRole(user: User, roleType: RoleType): Promise<void> {
        user.roleType = roleType
        return this.updateUser(user)
    }

    equals(chat: any): boolean {
        if (chat instanceof Chat) {
            return this.id === chat.id
        }
        return false
    }

    getUserEventStream(): Observable<UserEvent> {
        return this.userEvents.allEvents()
    }

    getUsers(): User[] {
        return this.users
    }

    getNameStream(): Observable<string> {
        return this.nameStream
    }

    getImageURLStream(): Observable<string> {
        return this.imageURLStream
    }

    getFireStreamUsers(): Array<FireStreamUser> {
        const firestreamUsers = new Array<FireStreamUser>()
        for (const user of this.users) {
            firestreamUsers.push(FireStreamUser.fromUser(user))
        }
        return firestreamUsers
    }

    getName(): string | undefined {
        return this.meta.name
    }

    getImageURL(): string | undefined {
        return this.meta.imageURL
    }

    path(): Path {
        return Paths.chatPath(this.id)
    }

    protected setMeta(meta: Chat.Meta) {
        this.meta = meta
    }

}

export namespace Chat {
    export class Meta {
        name?: string
        imageURL?: string
        created?: Date

        constructor(name?: string, imageURL?: string, created?: Date) {
            this.name = name
            this.imageURL = imageURL
            this.created = created
        }

        toData(includeTimestamp: boolean): IJson {
            const data: IJson = {}

            data[Keys.Name] = name
            data[Keys.ImageURL] = this.imageURL

            if (includeTimestamp) {
                data[Keys.Created] = FireStream.shared().getFirebaseService().core.timestamp()
            }

            const meta: IJson = {
                [Keys.Meta]: data
            }

            return meta
        }

        copy(): Meta {
            return new Meta(this.name, this.imageURL, this.created)
        }

        static with(name: string, imageURL: string): Meta {
            return new Meta(name, imageURL)
        }
    }
}
