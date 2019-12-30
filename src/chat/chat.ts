import { BehaviorSubject, Observable} from 'rxjs'

import { AbstractChat } from './abstract-chat'
import { User, DataProvider } from './user'
import { UserEvent } from '../events/user-event'
import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { flatMap } from 'rxjs/operators'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { Sendable } from '../message/sendable'
import { Paths } from '../firebase/service/paths'
import { EventType } from '../events/event-type'
import { Firefly } from '../firefly'
import { Keys } from '../firebase/service/keys'
import { Path } from '../firebase/service/path'
import { RoleType } from '../types/role-type'
import { InvitationType } from '../types/invitation-type'
import { FireflyUser } from '../namespace/firefly-user'
import { TypingStateType } from '../types/typing-state-type'
import { TypingState } from '../message/typing-state'
import { TextMessage } from '../message/text-message'
import { Message } from '../message/message'

export class Chat extends AbstractChat {

    protected id: string
    protected joined?: Date
    protected name?: string
    protected avatarURL?: string

    protected users = new Array<User>()
    protected userEvents = new MultiQueueSubject<UserEvent>()

    protected nameStream = new BehaviorSubject<string>('')
    protected avatarURLStream = new BehaviorSubject<string>('')

    constructor(id: string, joined?: Date) {
        super()
        this.id = id
        if (joined) {
            this.joined = joined
        }
    }

    async connect(): Promise<void> {
        this.disconnect()
        console.warn('Chat.connect()')

        // If delivery receipts are enabled, send the delivery receipt
        if (this.config.deliveryReceiptsEnabled) {
            this.dl.add(this.getEvents()
                    .getMessages()
                    .pastAndNewEvents()
                    .pipe(flatMap(message => {
                        return this.sendDeliveryReceipt(DeliveryReceiptType.received(), message.id)
                    }))
                    .subscribe(this))
        }

        this.dl.add(this.listChangeOn(Paths.groupChatUsersPath(this.id)).subscribe(listEvent => {
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
        const chatHandler = Firefly.shared().getFirebaseService().chat
        this.dl.add(chatHandler.metaOn(Paths.groupChatPath(this.id)).subscribe(meta => {
            if (meta != null) {
                const newName = meta[Keys.Name]
                if (typeof newName === 'string') {
                    if (newName !== this.name) {
                        this.name = newName
                        this.nameStream.next(this.name)
                    }
                }
                const newAvatarURL = meta[Keys.Avatar]
                if (typeof newAvatarURL === 'string') {
                    if (newAvatarURL !== this.avatarURL) {
                        this.avatarURL = newAvatarURL
                        this.avatarURLStream.next(this.avatarURL)
                    }
                }
            }
        }, this.error))

        await super.connect()
    }

    messagesPath(): Path {
        return Paths.groupChatMessagesPath(this.id)
    }

    static async create(name: string, avatarURL: string, users: User[]): Promise<Chat> {
        const meta: { [key: string]: any } = {}

        meta[Keys.Created] = Firefly.shared().core!.timestamp()
        if (name) {
            meta[Keys.Name] = name
        }
        if (avatarURL) {
            meta[Keys.Avatar] = avatarURL
        }

        const data: { [key: string]: any } = {}
        data[Keys.Meta] = meta

        const chatId = await Firefly.shared().getFirebaseService().chat.add(Paths.chatsPath(), data)
        const groupChat = new Chat(chatId)
        const usersToAdd = Array<User>()
        for (const user of users) {
            if (!user.isMe()) {
                usersToAdd.push(user)
            }
        }
        usersToAdd.push(User.currentUser(RoleType.owner()))
        await groupChat.addUsers(usersToAdd)
        await groupChat.inviteUsers(users)
        return groupChat
    }

    async inviteUsers(users: User[]): Promise<void> {
        const promises = new Array<Promise<void>>()
        for (const user of users) {
            if (!user.isMe()) {
                promises.push(Firefly.shared().sendInvitation(user.id, InvitationType.chat(), this.id).then())
            }
        }
        await Promise.all(promises)
    }

    send(sendable: Sendable): Promise<string>
    send(toUserId: string, sendable: Sendable): Promise<string>
    send(arg1: string | Sendable, arg2?: Sendable): Promise<string> {
        return super.sendToPath(Paths.groupChatMessagesPath(this.id), arg2 || (arg1 as Sendable))
    }

    addUsers(users: User[]): Promise<void>
    addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void>
    addUsers(arg1: Path | User[], arg2?: DataProvider, arg3?: User[]): Promise<void> {
        return super.addUsers(Paths.groupChatUsersPath(this.id), User.roleTypeDataProvider(),  arg3 || (arg1 as User[]))
    }

    updateUser(user: User): Promise<void>
    updateUser(path: Path, dataProvider: DataProvider, user: User): Promise<void>
    updateUser(arg1: Path | User, arg2?: DataProvider, arg3?: User): Promise<void> {
        return super.updateUser(Paths.groupChatUsersPath(this.id), User.roleTypeDataProvider(), arg3 || (arg1 as User))
    }

    updateUsers(users: User[]): Promise<void>
    updateUsers(path: Path, dataProvider: DataProvider, user: User[]): Promise<void>
    updateUsers(arg1: Path | User[], arg2?: DataProvider, arg3?: User[]): Promise<void> {
        return super.updateUsers(Paths.groupChatUsersPath(this.id), User.roleTypeDataProvider(), arg3 || (arg1 as User[]))
    }

    removeUser(user: User): Promise<void>
    removeUser(path: Path, user: User): Promise<void>
    removeUser(arg1: User | Path, arg2?: User): Promise<void> {
        return super.removeUser(Paths.groupChatUsersPath(this.id), arg2 || (arg1 as User))
    }

    removeUsers(users: User[]): Promise<void>
    removeUsers(path: Path, users: User[]): Promise<void>
    removeUsers(arg1: User[] | Path, arg2?: User[]): Promise<void> {
        return super.removeUsers(Paths.groupChatUsersPath(this.id), arg2 || (arg1 as User[]))
    }

    getId(): string {
        return this.id
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
    sendDeliveryReceipt(type: DeliveryReceiptType, messageId: string): Promise<string> {
        return this.send(new DeliveryReceipt(type, messageId))
    }

    /**
     * Send a typing indicator update to a user. This should be sent when the user
     * starts or stops typing
     * @param type - the status getBodyType
     * @return - subscribe to get a completion, error update from the method
     */
    sendTypingIndicator(type: TypingStateType): Promise<string> {
        return this.send(new TypingState(type))
    }

    sendMessageWithText(text: string): Promise<string> {
        return this.send(new TextMessage(text))
    }

    sendMessageWithBody(body: { [key: string]: any }): Promise<string> {
        return this.send(new Message(body))
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
     * depend on your admin level
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
        return this.userEvents
    }

    getUsers(): User[] {
        return this.users
    }

    getNameStream(): Observable<string> {
        return this.nameStream
    }

    getAvatarURLStream(): Observable<string> {
        return this.avatarURLStream
    }

    getFireflyUsers(): Array<FireflyUser> {
        const fireflyUsers = new Array<FireflyUser>()
        for (const user of this.users) {
            fireflyUsers.push(FireflyUser.fromUser(user))
        }
        return fireflyUsers
    }

}
