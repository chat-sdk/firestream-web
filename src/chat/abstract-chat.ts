import { empty, ErrorObserver, Observable, Subscription } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { Event } from '../events'
import { EventType } from '../events/event-type'
import { ListData } from '../events/list-data'
import { Filter, Predicate } from '../filter/filter'
import { SubscriptionMap } from '../firebase/rx/subscription-map'
import { FirebaseService } from '../firebase/service/firebase-service'
import { Path } from '../firebase/service/path'
import { FireStreamStore } from '../firestream-store'
import { IAbstractChat } from '../interfaces/abstract-chat'
import { Consumer } from '../interfaces/consumer'
import { ISendable } from '../interfaces/sendable'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { Invitation } from '../message/invitation'
import { Message } from '../message/message'
import { Presence } from '../message/presence'
import { TypingState } from '../message/typing-state'
import { SendableType } from '../types/sendable-types'
import { ArrayUtils } from '../utils/array-utils'
import { Events } from './events'
import { DataProvider, User } from './user'

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
    protected messagesOn(): Observable<Event<ISendable>>
    /**
     * Start listening to the current message reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of message results
     */
    protected messagesOn(newerThan: Date): Observable<Event<ISendable>>
    protected messagesOn(newerThan?: Date): Observable<Event<ISendable>> {
        const $events = FirebaseService.core.messagesOn(this.messagesPath(), newerThan, FireStreamStore.config.messageHistoryLimit)
        $events.forEach(event => {
            const sendable = event.get()
            const previous = this.getSendable(sendable.getId())
            if (event.typeIs(EventType.Added)) {
                this.sendables.push(sendable)
            }
            if (previous != null) {
                if (event.typeIs(EventType.Modified)) {
                    sendable.copyTo(previous)
                }
                if (event.typeIs(EventType.Removed)) {
                    this.sendables = ArrayUtils.remove(this.sendables, previous)
                }
            }
            this.getSendableEvents().getSendables().next(event)
        })
        return $events.pipe(catchError(err => {
            this.events.publishThrowable().next(err)
            return empty()
        }))
    }

    /**
     * Get a updateBatch of messages once
     * @param fromDate get messages from this date
     * @param toDate get messages until this date
     * @param limit limit the maximum number of messages
     * @return a events of message results
     */
    loadMoreMessages(fromDate?: Date, toDate?: Date, limit?: number): Promise<ISendable[]> {
        return FirebaseService.core.loadMoreMessages(this.messagesPath(), fromDate, toDate, limit)
    }

    loadMoreMessagesFrom(fromDate?: Date, limit?: number): Promise<ISendable[]> {
        return this.loadMoreMessages(fromDate, undefined, limit)
    }

    loadMoreMessagesTo(toDate?: Date, limit?: number): Promise<ISendable[]> {
        return this.loadMoreMessages(undefined, toDate, limit)
    }

    async loadMoreMessagesBefore(toDate?: Date, limit?: number): Promise<ISendable[]> {
        const before = toDate && new Date(toDate.getTime() - 1)
        return this.loadMoreMessagesTo(before, limit)
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
    protected listChangeOn(path: Path): Observable<Event<ListData>> {
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
    protected deleteSendable(messagesPath: Path): Promise<void> {
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
     * @param event sendable event
     */
    protected passMessageResultToStream(event: Event<ISendable>) {
        const sendable = event.get()

        FireStreamStore.debug(`Sendable: ${sendable.getType()} ${sendable.getId()}, date: ${sendable.getDate().getTime()}`)

        // In general, we are mostly interested when messages are added
        if (sendable.isType(SendableType.message())) {
            this.events.getMessages().next(event.to(Message.fromSendable(sendable)))
        }
        if (sendable.isType(SendableType.deliveryReceipt())) {
            this.events.getDeliveryReceipts().next(event.to(DeliveryReceipt.fromSendable(sendable)))
        }
        if (sendable.isType(SendableType.typingState())) {
            this.events.getTypingStates().next(event.to(TypingState.fromSendable(sendable)))
        }
        if (sendable.isType(SendableType.invitation())) {
            this.events.getInvitations().next(event.to(Invitation.fromSendable(sendable)))
        }
        if (sendable.isType(SendableType.presence())) {
            this.events.getPresences().next(event.to(Presence.fromSendable(sendable)))
        }
    }

    getSendables(type?: SendableType): ISendable[] {
        if (type) {
            return this.sendables.filter(sendable => sendable.isType(type))
        } else {
            return this.sendables
        }
    }

    getSendablesAs<T extends ISendable>(instanceClass: new () => T, type?: SendableType): T[] {
        return this.getSendables(type).map(s => s.copyTo(new instanceClass()))
    }

    getSendable(id: string): ISendable | undefined {
        for (const sendable of this.sendables) {
            if (sendable.getId() === id) {
                return sendable
            }
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

    abstract markRead(sendable: ISendable): Promise<void>
    abstract markReceived(sendable: ISendable): Promise<void>

    protected deliveryReceiptFilter(): Predicate<Event<ISendable>> {
        return Filter.combine(
            Filter.markReceived(FireStreamStore.config),
            Filter.notFromMe(),
            Filter.byEventType(EventType.Added),
        )
    }

}
