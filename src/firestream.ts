import { BehaviorSubject, Observable } from 'rxjs'
import { filter, flatMap } from 'rxjs/operators'

import { AbstractChat } from './chat/abstract-chat'
import { Chat } from './chat/chat'
import { User } from './chat/user'
import { Config, DatabaseType } from './config'
import { ChatEvent } from './events/chat-event'
import { ConnectionEvent } from './events/connection-event'
import { EventType } from './events/event-type'
import { UserEvent } from './events/user-event'
import { MessageStreamFilter } from './filter/message-stream-filter'
import { MultiQueueSubject } from './firebase/rx/multi-queue-subject'
import { FirebaseService } from './firebase/service/firebase-service'
import { Path } from './firebase/service/path'
import { Paths } from './firebase/service/paths'
import { IChat } from './interfaces/chat'
import { Consumer } from './interfaces/consumer'
import { IFireStream } from './interfaces/firestream'
import { IJson } from './interfaces/json'
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
import { FirestoreCoreHandler } from './firebase/firestore/firestore-core-handler'
import { FirestoreChatHandler } from './firebase/firestore/firestore-chat-handler'
import { ISendable } from './interfaces/sendable'

export class FireStream extends AbstractChat implements IFireStream {

    private static instance: FireStream

    protected contacts = new Array<User>()
    protected blocked = new Array<User>()

    protected chatEvents = new MultiQueueSubject<ChatEvent>()
    protected contactEvents = new MultiQueueSubject<UserEvent>()
    protected blockedEvents = new MultiQueueSubject<UserEvent>()

    protected connectionEvents = new BehaviorSubject<ConnectionEvent>(((null as unknown) as ConnectionEvent))

    static get shared() {
        if (!this.instance) {
            this.instance = new FireStream()
        }
        return this.instance
    }

    protected chats = new Array<IChat>()

    initialize(app: firebase.app.App, config?: Config) {
        FirebaseService.setApp(app)

        if (config) {
            this.config = config
        }

        if (this.config.database == DatabaseType.Firestore && FirebaseService.app) {
            FirebaseService.core = new FirestoreCoreHandler(FirebaseService.app)
            FirebaseService.chat = new FirestoreChatHandler()
        }
        if (this.config.database == DatabaseType.Realtime) {
            // this.firebaseService = new RealtimeService()
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
        return this.config != null
    }

    async connect(): Promise<void> {
        if (this.config == null) {
            throw new Error('You need to call Fire.Stream.initialize(…)')
        }
        if (FirebaseService.user == null) {
            throw new Error('Firebase must be authenticated to connect')
        }

        this.connectionEvents.next(ConnectionEvent.willConnect())

        // MESSAGE DELETION

        // We always delete typing state and presence messages
        let stream$ = this.getSendableEvents().getSendables().allEvents()
        if (!this.config.deleteMessagesOnReceipt) {
            stream$ = stream$.pipe(
                filter(MessageStreamFilter.bySendableType(SendableType.typingState(), SendableType.presence()))
            )
        }
        // If deletion is enabled, we don't filter so we delete all the message types
        this.sm.add(stream$.pipe(flatMap(this.deleteSendable)).subscribe())

        // DELIVERY RECEIPTS

        this.sm.add(this.getSendableEvents().getMessages().allEvents().subscribe(async message => {
            try {
                // If delivery receipts are enabled, send the delivery receipt
                if (this.config.deliveryReceiptsEnabled) {
                    await this.markReceived(message)
                }
                // If message deletion is disabled, instead mark the message as received. This means
                // that when we add a listener, we only get new messages
                if (!this.config.deleteMessagesOnReceipt) {
                    await this.sendDeliveryReceipt(this.currentUserId()!, DeliveryReceiptType.received(), message.id)
                }
            } catch (err) {
                this.error(err)
            }
        }))

        // INVITATIONS

        this.sm.add(this.getSendableEvents().getInvitations().allEvents().pipe(flatMap(invitation => {
            if (this.config.autoAcceptChatInvite) {
                return invitation.accept()
            }
            return Promise.resolve()
        })).subscribe(this))

        // BLOCKED USERS

        this.sm.add(this.listChangeOn(Paths.blockedPath()).subscribe(listEvent => {
            const ue = UserEvent.from(listEvent)
            if (ue.type == EventType.Added) {
                this.blocked.push(ue.user)
            }
            if (ue.type == EventType.Removed) {
                this.blocked = this.blocked.filter(user => !user.equals(ue.user))
            }
            this.blockedEvents.next(ue)
        }))

        // CONTACTS

        this.sm.add(this.listChangeOn(Paths.contactsPath()).subscribe(listEvent => {
            const ue = UserEvent.from(listEvent)
            if (ue.type == EventType.Added) {
                this.contacts.push(ue.user)
            }
            else if (ue.type == EventType.Removed) {
                this.contacts = this.contacts.filter(user => !user.equals(ue.user))
            }
            this.contactEvents.next(ue)
        }))

        // CONNECT TO EXISTING GROUP CHATS

        this.sm.add(this.listChangeOn(Paths.userChatsPath()).subscribe(listEvent => {
            const chatEvent = ChatEvent.from(listEvent)
            const chat = chatEvent.chat
            if (chatEvent.type == EventType.Added) {
                chat.connect()
                this.chats.push(chat)
                this.chatEvents.next(chatEvent)
            }
            else if (chatEvent.type == EventType.Removed) {
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

    currentUserId(): string {
        return FirebaseService.userId
    }

    //
    // Messages
    //

    deleteSendable(sendable: ISendable): Promise<void> {
        return super.deleteSendableAtPath(Paths.messagePath(sendable.id))
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

    /**
     * Send a delivery receipt to a user. If delivery receipts are enabled,
     * a 'received' status will be returned as soon as a message is delivered
     * and then you can then manually send a 'read' status when the user
     * actually reads the message
     * @param userId - the recipient user id
     * @param type - the status getBodyType
     * @return - subscribe to get a completion, error update from the method
     */
    sendDeliveryReceipt(userId: string, type: DeliveryReceiptType, messageId: string, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new DeliveryReceipt(type, messageId), newId)
    }

    /**
     * Send a typing indicator update to a user. This should be sent when the user
     * starts or stops typing
     * @param userId - the recipient user id
     * @param type - the status getBodyType
     * @return - subscribe to get a completion, error update from the method
     */
    sendTypingIndicator(userId: string, type: TypingStateType, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new TypingState(type), newId)
    }

    sendMessageWithText(userId:  string, text: string, newId?: Consumer<string>): Promise<void> {
        return this.send(userId, new TextMessage(text), newId)
    }

    sendMessageWithBody(userId: string, body: IJson, newId?: Consumer<string>): Promise<void> {
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
        user.contactType = type
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

    async createChat(name: string, avatarURL: string, users: User[]): Promise<Chat> {
        const chat = await Chat.create(name, avatarURL, users)
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
    markRead(message: Message): Promise<void> {
        return this.sendDeliveryReceipt(message.from, DeliveryReceiptType.read(), message.id)
    }

    /**
     * Send a received receipt
     * @return completion
     */
    markReceived(message: Message): Promise<void> {
        return this.sendDeliveryReceipt(message.from, DeliveryReceiptType.received(), message.id)
    }

    //
    // Events
    //

    getChatEvents(): MultiQueueSubject<ChatEvent> {
        return this.chatEvents
    }

    getBlockedEvents(): MultiQueueSubject<UserEvent> {
        return this.blockedEvents
    }

    getContactEvents(): MultiQueueSubject<UserEvent> {
        return this.contactEvents
    }

    //
    // Utility
    //

    protected dateOfLastDeliveryReceipt(): Promise<Date> {
        if (this.config.deleteMessagesOnReceipt) {
            return Promise.resolve(new Date(0))
        } else {
            return super.dateOfLastDeliveryReceipt()
        }
    }

    currentUser(): User {
        return new User(this.currentUserId())
    }

    protected messagesPath(): Path {
        return Paths.messagesPath()
    }

    getConfig(): Config {
        return this.config
    }

    getFirebaseService(): FirebaseService {
        return FirebaseService.shared
    }

    getConnectionEvents(): Observable<ConnectionEvent> {
        return this.connectionEvents.asObservable()
    }

}

// Namespace

/**
 * Just a convenience method to make invocations of FireStream more compact
 * Fire.Stream.sendMessage()
 * instead of
 * FireStream.shared().sendMessage()
 */
export namespace Fire {
    export const Stream = FireStream.shared
    export const api = () => FireStream.shared
}

/**
 * Even more convenient! Just F.S.sendMessage()!
 */
export namespace F {
    export const S = FireStream.shared
    export const ire = FireStream.shared
}
