import { Observable } from 'rxjs'

import { User } from '../chat/user'
import { Config } from '../config'
import { ChatEvent } from '../events/chat-event'
import { ConnectionEvent } from '../events/connection-event'
import { UserEvent } from '../events/user-event'
import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { FirebaseService } from '../firebase/service/firebase-service'
import { Sendable } from '../message/sendable'
import { ContactType } from '../types/contact-type'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'
import { InvitationType } from '../types/invitation-type'
import { PresenceType } from '../types/presence-type'
import { TypingStateType } from '../types/typing-state-type'
import { IAbstractChat } from './abstract-chat'
import { IChat } from './chat'
import { Consumer } from './consumer'
import { IJsonObject } from './json'

export interface IFireStream extends IAbstractChat {

    initialize(app: firebase.app.App, config?: Config): void
    isInitialized(): boolean

    /**
     * @return authenticated user
     */
    currentUser(): User | undefined

    // Messages

    /**
     * Send a delivery receipt to a user. If delivery receipts are enabled,
     * a 'received' status will be returned as soon as a errorMessage isType delivered
     * and then you can then manually send a 'read' status when the user
     * actually reads the errorMessage
     * @param userId the recipient user id
     * @param type the status getTypingStateType
     * @return promise
     */
    sendDeliveryReceipt(userId: string, type: DeliveryReceiptType, messageId: String, newId?: Consumer<String> ): Promise<void>

    sendInvitation(userId: string, type: InvitationType, groupId: string, newId?: Consumer<string>): Promise<void>

    send(toUserId: string, sendable: Sendable, newId?: Consumer<string>): Promise<void>

    deleteSendable(sendable: Sendable): Promise<void>

    sendPresence(userId: string, type: PresenceType, newId?: Consumer<string>): Promise<void>

    sendMessageWithText(userId: string, text: string, newId?: Consumer<string>): Promise<void>

    sendMessageWithBody(userId: string, body: IJsonObject, newId?: Consumer<string>): Promise<void>

    /**
     * Send a typing indicator update to a user. This should be sent when the user
     * starts or stops typing
     * @param userId the recipient user id
     * @param type the status getTypingStateType
     * @return promise
     */
    sendTypingIndicator(userId: string, type: TypingStateType, newId?: Consumer<String>): Promise<void>

    // Blocked

    block(user: User): Promise<void>
    unblock(user: User): Promise<void>
    getBlocked(): User[]
    isBlocked(user: User): boolean

    // Contacts

    addContact(user: User, type: ContactType): Promise<void>
    removeContact(user: User): Promise<void>
    getContacts(): User[]

    // Chats

    createChat(name?: string, imageURL?: string, users?: User[]): Promise<IChat>
    createChat(name?: string, imageURL?: string, customData?: IJsonObject, users?: User[]): Promise<IChat>

    /**
     * Leave the chat. When you leave, you will be removed from the
     * chat's roster
     * @param chat to leave
     * @return completion
     */
    leaveChat(chat: IChat): Promise<void>

    /**
     * Join the chat. To join you must already be in the chat roster
     * @param chat to join
     * @return completion
     */
    joinChat(chat: IChat): Promise<void>

    getChat(chatId: string): IChat | undefined
    getChats(): IChat[]

    // Events

    getChatEvents(): MultiQueueSubject<ChatEvent>
    getBlockedEvents(): MultiQueueSubject<UserEvent>
    getContactEvents(): MultiQueueSubject<UserEvent>
    getConnectionEvents(): Observable<ConnectionEvent>

}
