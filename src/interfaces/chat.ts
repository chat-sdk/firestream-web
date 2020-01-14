import { Observable } from 'rxjs'

import { User } from '../chat/user'
import { UserEvent } from '../events/user-event'
import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { Message } from '../message/message'
import { FireStreamUser } from '../namespace/firestream-user'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'
import { RoleType } from '../types/role-type'
import { TypingStateType } from '../types/typing-state-type'
import { IAbstractChat } from './abstract-chat'
import { Consumer } from './consumer'
import { IJsonObject } from './json'
import { ISendable } from './sendable'

/**
 * This interface is just provided for clarity
 */
export interface IChat extends IAbstractChat {

    /**
     * The unique chat id
     * @return id string
     */
    getId(): string

    /**
     * Remove the user from the chat's roster. It may be preferable to call
     * @see IFireStream#leaveChat(IChat)
     * @return completion
     */
    leave(): Promise<void>

    /**
     * Get the chat name
     * @return name
     */
    getName(): string

    /**
     * Set the chat name
     * @param name new name
     * @return completion
     */
    setName(name: string): Promise<void>

    /**
     * Get the group image url
     * @return image url
     */
    getImageURL(): string

    /**
     * Set the chat image url
     * @param url of group image
     * @return completion
     */
    setImageURL(url: string): Promise<void>

    /**
     * Get any custom data associated with the chat
     * @return custom data
     */
    getCustomData(): IJsonObject

    /**
     * Associate custom data with the chat - you can add your own
     * data to a chat - topic, extra links etc...
     * @param data custom data to write
     * @return completion
     */
    setCustomData(data: IJsonObject): Promise<void>

    /**
     * Get a list of members of the chat
     * @return list of users
     */
    getUsers(): User[]

    /**
     * Get a list of users with the FireStreamUser namespace
     * These are exactly the same users but may be useful if
     * your project already has a User class to avoid a clash
     * @return list of FireStreamUsers
     */
    getFireStreamUsers(): FireStreamUser[]


    /**
     * Add users to a chat
     * @param sendInvite should an invitation message be sent?
     * @param users users to add, set the role of each user using user.setRoleType()
     * @return completion
     */
    addUsers(sendInvite: boolean, users: User[]): Promise<void>

    /**
     * @see IChat#addUsers(Boolean, User[])
     */
    addUser(sendInvite: boolean, user: User): Promise<void>

    /**
     * Update users in chat
     * @param users users to update
     * @return completion
     */
    updateUsers(users: User[]): Promise<void>

    /**
     * @see IChat#updateUsers(User[])
     */
    updateUser(user: User): Promise<void>

    /**
     * Remove users from a chat
     * @param users users to remove
     * @return completion
     */
    removeUsers(users: User[]): Promise<void>

    /**
     * @see IChat#removeUsers(User[])
     */
    removeUser(user: User): Promise<void>

    /**
     * Send an invite message to users
     * @param users to invite
     * @return completion
     */
    inviteUsers(users: User[]): Promise<void>

    /**
     * Set the role of a user
     * @param user to update
     * @param roleType new role type
     * @return completion
     */
    setRole(user: User, roleType: RoleType): Promise<void>

    /**
     * Get the users for a particular role
     * @param roleType to find
     * @return list of users
     */
    getUsersForRoleType(roleType: RoleType): User[];

    /**
     * Get the role for a user
     * @param theUser to who's role to find
     * @return role
     */
    getRoleTypeForUser(theUser: User): RoleType;

    /**
     * Get an observable which is called when the name changes
     * @return observable
     */
    getNameChangeEvents(): Observable<string>

    /**
     * Get an observable which is called when the chat image changes
     * @return observable
     */
    getImageURLChangeEvents(): Observable<string>

    /**
     * Get an observable which is called when the custom data associated with the
     * chat is updated
     * @return observable
     */
    getCustomDataChangedEvents(): Observable<IJsonObject>

    /**
     * Get an observable which is called when the a user is added, removed or updated
     * @return observable
     */
    getUserEvents(): MultiQueueSubject<UserEvent>

    /**
     * Send a custom message
     * @param body custom message data
     * @param newId message's new ID before sending
     * @return completion
     */
    sendMessageWithBody(body: IJsonObject, newId?: Consumer<String>): Promise<void>

    /**
     * Send a custom message
     * @param body custom message data
     * @return completion
     */
    sendMessageWithBody(body: IJsonObject): Promise<void>

    /**
     * Send a text message
     * @param text message text
     * @param newId message's new ID before sending
     * @return completion
     */
    sendMessageWithText(text: string, newId?: Consumer<String>): Promise<void>

    /**
     * Send a text message
     * @param text message text
     * @return completion
     */
    sendMessageWithText(text: string): Promise<void>

    /**
     * Send a typing indicator message
     * @param type typing state
     * @param newId message's new ID before sending
     * @return completion
     */
    sendTypingIndicator(type: TypingStateType, newId?: Consumer<String>): Promise<void>

    /**
     * Send a typing indicator message. An indicator should be sent when starting and stopping typing
     * @param type typing state
     * @return completion
     */
    sendTypingIndicator(type: TypingStateType): Promise<void>

    /**
     * Send a delivery receipt to a user. If delivery receipts are enabled,
     * a 'received' status will be returned as soon as a message is delivered
     * and then you can then manually send a 'read' status when the user
     * actually reads the message
     * @param type receipt type
     * @param newId message's new ID before sending
     * @return completion
     */
    sendDeliveryReceipt(type: DeliveryReceiptType, messageId: string, newId?: Consumer<String>): Promise<void>

    /**
     * Send a delivery receipt to a user. If delivery receipts are enabled,
     * a 'received' status will be returned as soon as a message is delivered
     * and then you can then manually send a 'read' status when the user
     * actually reads the message
     * @param type receipt type
     * @return completion
     */
    sendDeliveryReceipt(type: DeliveryReceiptType, messageId: string): Promise<void>

    /**
     * Send a custom sendable
     * @param sendable to send
     * @param newId message's new ID before sending
     * @return completion
     */
    send(sendable: ISendable, newId?: Consumer<String>): Promise<void>

    /**
     * Send a custom sendable
     * @param sendable to send
     * @return completion
     */
    send(sendable: ISendable): Promise<void>

    /**
     * Mark a message as received
     * @param message to mark as received
     * @return completion
     */
    markReceived(message: Message): Promise<void>

    /**
     * Mark a message as read
     * @param message to mark as read
     * @return completion
     */
    markRead(message: Message): Promise<void>

}
