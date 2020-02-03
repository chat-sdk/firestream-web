import { BehaviorSubject, Observable } from 'rxjs'
import { filter, flatMap, map } from 'rxjs/operators'

import { AbstractChat } from './chat/abstract-chat'
import { Chat } from './chat/chat'
import { User } from './chat/user'
import { Config } from './config'
import { ErrorMessage } from './error-messages'
import { Event } from './events'
import { ConnectionEvent } from './events/connection-event'
import { EventType } from './events/event-type'
import { Filter } from './filter/filter'
import { FirestoreChatHandler } from './firebase/firestore/firestore-chat-handler'
import { FirestoreCoreHandler } from './firebase/firestore/firestore-core-handler'
import { RealtimeChatHandler } from './firebase/realtime/realtime-chat-handler'
import { RealtimeCoreHandler } from './firebase/realtime/realtime-core-handler'
import { MultiQueueSubject } from './firebase/rx/multi-queue-subject'
import { FirebaseService } from './firebase/service/firebase-service'
import { Path } from './firebase/service/path'
import { Paths } from './firebase/service/paths'
import { FireStreamStore } from './firestream-store'
import { IChat } from './interfaces/chat'
import { Consumer } from './interfaces/consumer'
import { IFireStream } from './interfaces/firestream'
import { IJsonObject } from './interfaces/json'
import { ISendable } from './interfaces/sendable'
import { DeliveryReceipt } from './message/delivery-receipt'
import { Invitation } from './message/invitation'
import { Message } from './message/message'
import { Presence } from './message/presence'
import { TextMessage } from './message/text-message'
import { TypingState } from './message/typing-state'
import { ContactType } from './types/contact-type'
import { DeliveryReceiptType } from './types/delivery-receipt-type'
import { InvitationType } from './types/invitation-type'
import { PresenceType } from './types/presence-type'
import { SendableType } from './types/sendable-types'
import { TypingStateType } from './types/typing-state-type'
import { ArrayUtils } from './utils/array-utils'

export class FireStream extends AbstractChat implements IFireStream {

    private static instance: IFireStream

    protected contacts = new Array<User>()
    protected blocked = new Array<User>()

    protected chatEvents = new MultiQueueSubject<Event<IChat>>()
    protected contactEvents = new MultiQueueSubject<Event<User>>()
    protected blockedEvents = new MultiQueueSubject<Event<User>>()

    protected connectionEvents = new BehaviorSubject<ConnectionEvent>(((null as unknown) as ConnectionEvent))

    static get shared(): IFireStream {
        if (!this.instance) {
            this.instance = new FireStream()
        }
        return this.instance
    }

    protected chats = new Array<IChat>()

    initialize(app: firebase.app.App, config?: Config) {
        FireStreamStore.setApp(app)

        FireStreamStore.setConfig(config || new Config())

        if (FireStreamStore.config.database == Config.DatabaseType.Firestore && FireStreamStore.app) {
            FirebaseService.core = new FirestoreCoreHandler(FireStreamStore.app)
            FirebaseService.chat = new FirestoreChatHandler()
        }
        if (FireStreamStore.config.database == Config.DatabaseType.Realtime) {
            FirebaseService.core = new RealtimeCoreHandler()
            FirebaseService.chat = new RealtimeChatHandler()
        }

        app.auth().onAuthStateChanged(async user => {
            if (user) {
                try {
                    await this.connect()
                } catch (err) {
                    console.error(err)
                }
            } else {
                this.disconnect()
            }
        }, error => {
            console.error(error)
        })
    }

    isInitialized(): boolean {
        try {
            return FireStreamStore.config != null
        } catch (err) {
            console.error(err.message)
            return false
        }
    }

    async connect(): Promise<void> {
        if (!this.isInitialized()) {
            throw new Error(ErrorMessage.initialize_not_run)
        }
        if (FireStreamStore.user == null) {
            throw new Error(ErrorMessage.no_authenticated_user)
        }

        this.connectionEvents.next(ConnectionEvent.willConnect())

        // MESSAGE DELETION

        // We always delete typing state and presence messages
        let $streamEvents = this.getSendableEvents().getSendables().allEvents()
        if (!FireStreamStore.config.deleteMessagesOnReceipt) {
            $streamEvents = $streamEvents.pipe(
                filter(Filter.eventBySendableType(SendableType.typingState(), SendableType.presence()))
            )
        }
        // If deletion is enabled, we don't filter so we delete all the message types
        const $sendables = $streamEvents.pipe(map(event => event.get()))
        this.sm.add($sendables.pipe(flatMap(this.deleteSendable)).subscribe())

        // DELIVERY RECEIPTS

        this.sm.add(this.getSendableEvents()
            .getMessages()
            .allEvents()
            .pipe(filter(this.deliveryReceiptFilter()))
            .pipe(flatMap(event => this.markReceived(event.get())))
            .subscribe(() => {}, this.error))

        // If message deletion is disabled, send a received receipt to ourself for each message. This means
        // that when we add a childListener, we only get new messages
        if (!this.getConfig().deleteMessagesOnReceipt && this.getConfig().startListeningFromLastSentMessageDate) {
            this.sm.add(this.getSendableEvents()
                .getMessages()
                .allEvents()
                .pipe(filter(Filter.notFromMe()))
                .pipe(flatMap(event => {
                    const uid = this.currentUserId()
                    if (!uid) {
                        throw new Error('currentUserId() retuned undefined')
                    }
                    return this.sendDeliveryReceipt(uid, DeliveryReceiptType.received(), event.get().getId())
                })).subscribe(() => {}, this.error))
        }

        // INVITATIONS

        this.sm.add(this.getSendableEvents().getInvitations().allEvents().pipe(flatMap(event => {
            if (FireStreamStore.config.autoAcceptChatInvite) {
                return event.get().accept()
            }
            return Promise.resolve()
        })).subscribe(this))

        // BLOCKED USERS

        this.sm.add(this.listChangeOn(Paths.blockedPath()).subscribe(listEvent => {
            const ue = listEvent.to(User.from(listEvent))
            if (ue.typeIs(EventType.Added)) {
                this.blocked.push(ue.get())
            }
            if (ue.typeIs(EventType.Removed)) {
                this.blocked = ArrayUtils.remove(this.blocked, ue.get())
            }
            this.blockedEvents.next(ue)
        }))

        // CONTACTS

        this.sm.add(this.listChangeOn(Paths.contactsPath()).subscribe(listEvent => {
            const ue = listEvent.to(User.from(listEvent))
            if (ue.typeIs(EventType.Added)) {
                this.contacts.push(ue.get())
            }
            else if (ue.typeIs(EventType.Removed)) {
                this.contacts = ArrayUtils.remove(this.contacts, ue.get())
            }
            this.contactEvents.next(ue)
        }))

        // CONNECT TO EXISTING GROUP CHATS

        this.sm.add(this.listChangeOn(Paths.userChatsPath()).subscribe(listEvent => {
            const chatEvent = listEvent.to(Chat.from(listEvent))
            const chat = chatEvent.get()
            if (chatEvent.typeIs(EventType.Added)) {
                chat.connect()
                this.chats.push(chat)
                this.chatEvents.next(chatEvent)
            }
            else if (chatEvent.typeIs(EventType.Removed)) {
                chat.leave()
                    .then(() => {
                        this.chats = this.chats.filter(c => c.getId() !== chat.getId())
                        this.chatEvents.next(chatEvent)
                    })
                    .catch(this.error)
            } else {
                this.chatEvents.next(chatEvent)
            }
        }))

        // Connect to the message events AFTER we have added our events listeners
        await super.connect()

        this.connectionEvents.next(ConnectionEvent.didConnect())
    }

    disconnect() {
        this.connectionEvents.next(ConnectionEvent.willDisconnect())
        super.disconnect()
        this.connectionEvents.next(ConnectionEvent.didDisconnect())
    }

    currentUserId(): string | undefined {
        return FireStreamStore.userId
    }

    //
    // Messages
    //

    deleteSendable(arg: Path | ISendable | string): Promise<void> {
        if (arg instanceof Path) {
            return super.deleteSendable(arg)
        } else if (typeof arg === 'string') {
            return super.deleteSendable(Paths.messagePath(arg))
        } else {
            return this.deleteSendable(arg.getId())
        }
    }

    sendPresence(userId: string, type: PresenceType): Promise<void> {
        return this.send(userId, new Presence(type))
    }

    sendInvitation(userId: string, type: InvitationType, groupId: string): Promise<void> {
        return this.send(userId, new Invitation(type, groupId))
    }

    send(toUserId: string, sendable: ISendable, newId?: Consumer<string>): Promise<void> {
        return this.sendToPath(Paths.messagesPath(toUserId), sendable, newId)
    }

    sendDeliveryReceipt(userId: string, type: DeliveryReceiptType, messageId: string, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new DeliveryReceipt(type, messageId), newId)
    }

    sendTypingIndicator(userId: string, type: TypingStateType, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new TypingState(type), newId)
    }

    sendMessageWithText(userId:  string, text: string, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new TextMessage(text), newId)
    }

    sendMessageWithBody(userId: string, body: IJsonObject, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new Message(body), newId)
    }

    //
    // Blocking
    //

    block(user: User): Promise<void> {
        return this.addUser(Paths.blockedPath(), User.dateDataProvider(), user)
    }

    unblock(user: User): Promise<void> {
        return this.removeUser(Paths.blockedPath(), user)
    }

    getBlocked(): User[] {
        return this.blocked
    }

    isBlocked(user: User): boolean {
        return !!this.blocked.find(u => u.equals(user))
    }

    //
    // Contacts
    //

    addContact(user: User, type: ContactType): Promise<void> {
        user.setContactType(type)
        return this.addUser(Paths.contactsPath(), User.contactTypeDataProvider(), user)
    }

    removeContact(user: User): Promise<void> {
        return this.removeUser(Paths.contactsPath(), user)
    }

    getContacts(): User[] {
        return this.contacts
    }

    //
    // Chats
    //

    createChat(name: string, imageURL: string, users: User[]): Promise<IChat>
    createChat(name: string, imageURL: string, customData: IJsonObject, users?: User[]): Promise<IChat>
    async createChat(name: string, avatarURL: string, arg3: User[] | IJsonObject, users?: User[]): Promise<IChat> {
        let chat: IChat
        if (Array.isArray(arg3)) {
            chat = await Chat.create(name, avatarURL, undefined, arg3)
        } else {
            chat = await Chat.create(name, avatarURL, arg3, users)
        }
        await this.joinChat(chat)
        return chat
    }

    getChat(chatId: string): IChat | undefined {
        for (const chat of this.chats) {
            if (chat.getId() === chatId) {
                return chat
            }
        }
    }

    leaveChat(chat: IChat): Promise<void> {
        return FirebaseService.chat.leaveChat(chat.getId())
    }

    joinChat(chat: IChat): Promise<void> {
        return FirebaseService.chat.joinChat(chat.getId())
    }

    getChats(): IChat[] {
        return this.chats
    }

    /**
     * Send a read receipt
     * @return completion
     */
    markRead(from: string, sendableId: string): Promise<void>
    markRead(sendable: ISendable): Promise<void>
    markRead(sendableOrFrom: ISendable | string, sendableId?: string): Promise<void> {
        if (typeof sendableOrFrom === 'string') {
            return this.sendDeliveryReceipt(sendableOrFrom, DeliveryReceiptType.read(), sendableId!)
        } else {
            return this.sendDeliveryReceipt(sendableOrFrom.getFrom(), DeliveryReceiptType.read(), sendableOrFrom.getId())
        }
    }

    /**
     * Send a received receipt
     * @return completion
     */
    markReceived(from: string, sendableId: string): Promise<void>
    markReceived(sendable: ISendable): Promise<void>
    markReceived(sendableOrFrom: ISendable | string, sendableId?: string): Promise<void> {
        if (typeof sendableOrFrom === 'string') {
            return this.sendDeliveryReceipt(sendableOrFrom, DeliveryReceiptType.received(), sendableId!)
        } else {
            return this.sendDeliveryReceipt(sendableOrFrom.getFrom(), DeliveryReceiptType.received(), sendableOrFrom.getId())
        }
    }

    //
    // Events
    //

    getChatEvents(): MultiQueueSubject<Event<IChat>> {
        return this.chatEvents
    }

    getBlockedEvents(): MultiQueueSubject<Event<User>> {
        return this.blockedEvents
    }

    getContactEvents(): MultiQueueSubject<Event<User>> {
        return this.contactEvents
    }

    getConnectionEvents(): Observable<ConnectionEvent> {
        return this.connectionEvents.asObservable()
    }

    //
    // Utility
    //

    protected dateOfLastDeliveryReceipt(): Promise<Date> {
        if (FireStreamStore.config.deleteMessagesOnReceipt) {
            return Promise.resolve(this.getConfig().listenToMessagesWithTimeAgo.getDate())
        } else {
            return super.dateOfLastDeliveryReceipt()
        }
    }

    currentUser(): User | undefined {
        const uid = this.currentUserId()
        if (uid) {
            return new User(uid)
        }
    }

    protected messagesPath(): Path {
        return Paths.messagesPath()
    }

    getConfig(): Config {
        return FireStreamStore.config
    }

    getFirebaseService(): FirebaseService {
        return FirebaseService.shared
    }

}
