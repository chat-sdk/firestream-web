import { ErrorObserver, Observable, Subscription } from 'rxjs'

import { Config } from '../config'
import { ListEvent } from '../events/list-event'
import { SubscriptionMap } from '../firebase/rx/subscription-map'
import { FirebaseService } from '../firebase/service/firebase-service'
import { Path } from '../firebase/service/path'
import { IAbstractChat } from '../interfaces/abstract-chat'
import { Consumer } from '../interfaces/consumer'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { Invitation } from '../message/invitation'
import { Message } from '../message/message'
import { Presence } from '../message/presence'
import { TypingState } from '../message/typing-state'
import { SendableType } from '../types/sendable-types'
import { Events } from './events'
import { DataProvider, User } from './user'
import { ISendable } from '../interfaces/sendable'

/**
 * This class handles common elements of a conversation bit it 1-to-1 or group.
 * Mainly sending and receiving messages.
 */
export abstract class AbstractChat implements ErrorObserver<any>, IAbstractChat {

    /**
     * Store the subscriptions so we can unsubscribe of all of them when the user logs out
     */
    protected sm = new SubscriptionMap()

    /**
     * Event events
     */
    protected events = new Events()

    /**
     * A list of all sendables received
     */
    protected sendables = new Array<ISendable>()

    /**
     * Current configuration
     */
    protected config = new Config()

    constructor() {
        
    }

    /**
     * Error handler method so we can redirect all errors to the error events
     * @param throwable - the events error
     * @throws Exception
     */
    error(err: Error) {
        this.events.publishThrowable().next(err)
    }

    /**
     * Start listening to the current message reference and retrieve all messages
     * @return a events of message results
     */
    protected messagesOn(): Observable<ISendable>
    /**
     * Start listening to the current message reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of message results
     */
    protected messagesOn(newerThan: Date): Observable<ISendable>
    protected messagesOn(newerThan?: Date): Observable<ISendable> {
        const $sendables = FirebaseService.core.messagesOn(this.messagesPath(), newerThan, this.config.messageHistoryLimit)
        $sendables.forEach(sendable => {
            if (sendable) {
                this.getSendableEvents().getSendables().next(sendable)
                this.sendables.push(sendable)
            }
        })
        return $sendables
    }

    /**
     * Get a updateBatch of messages once
     * @param fromDate get messages from this date
     * @param toDate get messages until this date
     * @param limit limit the maximum number of messages
     * @return a events of message results
     */
    messagesOnce(fromDate?: Date, toDate?: Date, limit?: number): Observable<ISendable> {
        return FirebaseService.core.messagesOnce(this.messagesPath(), fromDate, toDate, limit)
    }

    /**
     * This method gets the date of the last delivery receipt that we sent - i.e. the
     * last message WE received.
     * @return single date
     */
    protected async dateOfLastDeliveryReceipt(): Promise<Date> {
        return FirebaseService.core.dateOfLastSentMessage(this.messagesPath())
    }

    /**
     * Listen for changes in the value of a list reference
     * @param path to listen to
     * @return events of list events
     */
    protected listChangeOn(path: Path): Observable<ListEvent> {
        return FirebaseService.core.listChangeOn(path)
    }

    /**
     * Send a message to a messages ref
     * @param messagesPath
     * @param sendable item to be sent
     * @param newId the ID of the new message
     * @return single containing message id
     */
    sendToPath(messagesPath: Path, sendable: ISendable, newId?: Consumer<string>): Promise<void> {
        return FirebaseService.core.send(messagesPath, sendable, newId)
    }

    /**
     * Delete a sendable from our queue
     * @param messagesPath
     * @return completion
     */
    protected deleteSendableAtPath(messagesPath: Path): Promise<void> {
        return FirebaseService.core.deleteSendable(messagesPath)
    }

    /**
     * Remove a user from a reference
     * @param path for users
     * @param user to remove
     * @return completion
     */
    protected removeUser(path: Path, user: User): Promise<void> {
        return this.removeUsers(path, [user])
    }

    /**
     * Remove users from a reference
     * @param path for users
     * @param users to remove
     * @return completion
     */
    protected removeUsers(path: Path, users: User[]): Promise<void> {
        return FirebaseService.core.removeUsers(path, users)
    }

    /**
     * Add a user to a reference
     * @param path for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param user to add
     * @return completion
     */
    protected addUser(path: Path, dataProvider: DataProvider, user: User): Promise<void> {
        return this.addUsers(path, dataProvider, [user])
    }

    /**
     * Add users to a reference
     * @param path
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param users to add
     * @return completion
     */
    public addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        return FirebaseService.core.addUsers(path, dataProvider, users)
    }

    /**
     * Updates a user for a reference
     * @param path for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param user to update
     * @return completion
     */
    updateUser(path: Path, dataProvider: DataProvider, user: User): Promise<void> {
        return this.updateUsers(path, dataProvider, [user])
    }

    /**
     * Update users for a reference
     * @param path for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param users to update
     * @return completion
     */
    updateUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        return FirebaseService.core.updateUsers(path, dataProvider, users)
    }

    /**
     * Connect to the chat
     * @throws Exception error if we are not connected
     */
    async connect(): Promise<void> {
        const date =  await this.dateOfLastDeliveryReceipt()
        this.sm.add(this.messagesOn(date).subscribe(this.passMessageResultToStream.bind(this), this.error))
    }

    /**
     * Disconnect from a chat
     */
    disconnect() {
        this.sm.unsubscribe()
    }

    /**
     * Convenience method to cast sendables and send them to the correct events
     * @param sendable the base sendable
     */
    protected passMessageResultToStream(sendable: ISendable) {

        if (sendable.type === SendableType.Message) {
            this.events.getMessages().next(Message.fromSendable(sendable))
        }
        if (sendable.type === SendableType.DeliveryReceipt) {
            this.events.getDeliveryReceipts().next(DeliveryReceipt.fromSendable(sendable))
        }
        if (sendable.type === SendableType.TypingState) {
            this.events.getTypingStates().next(TypingState.fromSendable(sendable))
        }
        if (sendable.type === SendableType.Invitation) {
            this.events.getInvitations().next(Invitation.fromSendable(sendable))
        }
        if (sendable.type === SendableType.Presence) {
            this.events.getPresences().next(Presence.fromSendable(sendable))
        }

    }

    getSendables(type?: SendableType): ISendable[] {
        if (type) {
            return this.sendables.filter(sendable => sendable && sendable.type === type.get())
        } else {
            return this.sendables
        }
    }

    /**
     * returns the events object which exposes the different sendable streams
     * @return events
     */
    getSendableEvents(): Events {
        return this.events
    }

    /**
     * Overridable messages reference
     * @return Firestore messages reference
     */
    protected abstract messagesPath(): Path

    getSubscriptionMap(): SubscriptionMap {
        return this.sm
    }

    manage(subscription: Subscription) {
        this.getSubscriptionMap().add(subscription)
    }

    abstract markRead(message: Message): Promise<void>
    abstract markReceived(message: Message): Promise<void>

}