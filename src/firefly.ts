import { Observable } from 'rxjs'

import { Config, DatabaseType } from './config'
import { AbstractChat } from './chat/abstract-chat'
import { Chat } from './chat/chat'
import { User } from './chat/user'
import { FirebaseService } from './firebase/service/firebase-service'
import { FirestoreService } from './firebase/firestore/firestore-service'
import { MultiQueueSubject } from './firebase/rx/multi-queue-subject'
import { Path } from './firebase/service/path'
import { Paths } from './firebase/service/paths'
import { ChatEvent } from './events/chat-event'
import { UserEvent } from './events/user-event'
import { Sendable } from './message/sendable'
import { Message } from './message/message'
import { TextMessage } from './message/text-message'
import { TypingState } from './message/typing-state'
import { Presence } from './message/presence'
import { Invitation } from './message/invitation'
import { DeliveryReceipt } from './message/delivery-receipt'
import { PresenceType } from './types/presence-type'
import { InvitationType } from './types/invitation-type'
import { DeliveryReceiptType } from './types/delivery-receipt-type'
import { TypingStateType } from './types/typing-state-type'
import { ContactType } from './types/contact-type'
import { filter, flatMap } from 'rxjs/operators'
import { SendableType } from './types/sendable-types'
import { MessageStreamFilter } from './filter/message-stream-filter'
import { EventType } from './events/event-type'
import { IJson } from './interfaces/json'

export class Firefly extends AbstractChat {

    private static instance: Firefly

    private fbApp?: firebase.app.App
    private user?: firebase.User

    protected contacts = new Array<User>()
    protected blocked = new Array<User>()

    protected chatEvents = new MultiQueueSubject<ChatEvent>()
    protected contactEvents = new MultiQueueSubject<UserEvent>()
    protected blockedEvents = new MultiQueueSubject<UserEvent>()

    protected firebaseService?: FirebaseService

    static shared() {
        if (!this.instance) {
            this.instance = new Firefly()
        }
        return this.instance
    }

    protected chats = new Array<Chat>()

    initialize(app: firebase.app.App, config?: Config) {
        this.fbApp = app

        if (config) {
            this.config = config
        }

        if (this.config.database == DatabaseType.Firestore) {
            this.firebaseService = new FirestoreService()
        }
        if (this.config.database == DatabaseType.Realtime) {
            // this.firebaseService = new RealtimeService()
        }

        app.auth().onAuthStateChanged(async user => {
            this.user = user || undefined
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

    get firebaseApp(): firebase.app.App {
        if (!this.fbApp) {
            throw new Error('Firefly needs to be initialized!')
        }
        return this.fbApp
    }

    async connect(): Promise<void> {
        this.disconnect()
        console.warn('Firefly.connect()')

        if (this.config == null) {
            throw new Error('You need to call Fl.y.initialize(…)')
        }
        if (this.user == null) {
            throw new Error('Firebase must be authenticated to connect')
        }

        // MESSAGE DELETION

        // We always delete typing state and presence messages
        let stream$ = this.getEvents().getSendables().pastAndNewEvents()
        if (!this.config.deleteMessagesOnReceipt) {
            stream$ = stream$.pipe(
                filter(MessageStreamFilter.bySendableType(SendableType.typingState(), SendableType.presence()))
            )
            stream$.forEach(sendable => {
                console.warn(sendable.type, sendable.body)
            })
        }
        // If deletion is enabled, we don't filter so we delete all the message types
        this.dl.add(stream$.pipe(flatMap(this.deleteSendable)).subscribe())

        // DELIVERY RECEIPTS

        this.dl.add(this.getEvents().getMessages().pastAndNewEvents().subscribe(async message => {
            try {
                // If delivery receipts are enabled, send the delivery receipt
                if (this.config.deliveryReceiptsEnabled) {
                    await this.sendDeliveryReceipt(message.from, DeliveryReceiptType.received(), message.id)
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

        this.dl.add(this.getEvents().getInvitations().pastAndNewEvents().pipe(flatMap(invitation => {
            if (this.config.autoAcceptChatInvite) {
                return invitation.accept()
            }
            return Promise.resolve()
        })).subscribe(this))

        // BLOCKED USERS

        this.dl.add(this.listChangeOn(Paths.blockedPath()).subscribe(listEvent => {
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

        this.dl.add(this.listChangeOn(Paths.contactsPath()).subscribe(listEvent => {
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

        this.dl.add(this.listChangeOn(Paths.userGroupChatsPath()).subscribe(listEvent => {
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
                        this.chats = this.chats.filter(c => !c.equals(chat))
                        this.chatEvents.next(chatEvent)
                    })
                    .catch(this.error)
            } else {
                this.chatEvents.next(chatEvent)
            }
        }))

        // Connect to the message events AFTER we have added our events listeners
        await super.connect()
    }

    currentUserId(): string | undefined {
        return this.user?.uid
    }

    //
    // Messages
    //

    deleteSendable(sendable: Sendable): Promise<void> {
        return super.deleteSendableAtPath(Paths.messagePath(sendable.id))
    }

    sendPresence(userId: string, type: PresenceType): Promise<string> {
        return this.send(userId, new Presence(type))
    }

    sendInvitation(userId: string, type: InvitationType, groupId: string): Promise<string> {
        return this.send(userId, new Invitation(type, groupId))
    }

    send(toUserId: string, sendable: Sendable): Promise<string> {
        return this.sendToPath(Paths.messagesPath(toUserId), sendable)
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
    sendDeliveryReceipt(userId: string, type: DeliveryReceiptType, messageId: string): Promise<string> {
        return this.send(userId, new DeliveryReceipt(type, messageId))
    }

    /**
     * Send a typing indicator update to a user. This should be sent when the user
     * starts or stops typing
     * @param userId - the recipient user id
     * @param type - the status getBodyType
     * @return - subscribe to get a completion, error update from the method
     */
    sendTypingIndicator(userId: string, type: TypingStateType): Promise<string> {
        return this.send(userId, new TypingState(type))
    }

    sendMessageWithText(userId:  string, text: string): Promise<string> {
        return this.send(userId, new TextMessage(text))
    }

    sendMessageWithBody(userId: string, body: IJson): Promise<string> {
        return this.send(userId, new Message(body))
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
        const groupChat = await Chat.create(name, avatarURL, users)
        await this.joinChat(groupChat.getId())
        return groupChat
    }

    getChat(chatId: string): Chat | undefined {
        for (const chat of this.chats) {
            if (chat.getId() === chatId) {
                return chat
            }
        }
    }

    leaveChat(chatId: string): Promise<void> {
        return this.getFirebaseService().chat.leaveChat(chatId)
    }

    joinChat(chatId: string): Promise<void> {
        return this.getFirebaseService().chat.joinChat(chatId)
    }

    getChats(): Chat[] {
        return this.chats
    }

    //
    // Events
    //

    getChatEvents(): Observable<ChatEvent> {
        return this.chatEvents
    }

    getBlockedEvents(): Observable<UserEvent> {
        return this.blockedEvents
    }

    getContactEvents(): Observable<UserEvent> {
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

    protected messagesPath(): Path {
        return Paths.messagesPath()
    }

    getConfig(): Config {
        return this.config
    }

    getFirebaseService(): FirebaseService {
        if (!this.firebaseService) {
            throw new Error('Firefly needs to be initialized!')
        }
        return this.firebaseService
    }

}

export { Fire } from './namespace/fire'
export { Fl } from './namespace/fl'
