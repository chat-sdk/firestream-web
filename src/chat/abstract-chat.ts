import { Observable, ErrorObserver } from 'rxjs'

import { FirebaseCoreHandler } from '../firebase/service/firebase-core-handler'
import { DisposableList } from '../firebase/rx/disposable-list'
import { Path } from '../firebase/service/path'
import { Firefly } from '../firefly'
import { Config } from '../config'
import { User, DataProvider } from './user'
import { Events } from './events'
import { SendableType } from '../types/sendable-types'
import { ListEvent } from '../events/list-event'
import { Sendable } from '../message/sendable'
import { Message } from '../message/message'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { TypingState } from '../message/typing-state'
import { Invitation } from '../message/invitation'
import { Presence } from '../message/presence'

/**
 * This class handles common elements of a conversation bit it 1-to-1 or group.
 * Mainly sending and receiving messages.
 */
export abstract class AbstractChat  implements ErrorObserver<any> {

    /**
     * Store the disposables so we can dispose of all of them when the user logs out
     */
    protected dl = new DisposableList()

    /**
     * Event events
     */
    protected events = new Events()

    /**
     * A list of all sendables received
     */
    protected sendables = new Array<Sendable>()

    /**
     * Current configuration
     */
    protected config = new Config()

    /**
     * Make sure that `FirebaseCoreHandler` is
     * initialized and throw an error if not
     */
    get core(): FirebaseCoreHandler {
        const core = Firefly.shared().getFirebaseService().core
        if (!core) {
            throw new Error('FirebaseCoreHandler is undefined')
        }
        return core
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
    protected messagesOn(): Observable<Sendable>
    /**
     * Start listening to the current message reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of message results
     */
    protected messagesOn(newerThan: Date): Observable<Sendable>
    protected messagesOn(newerThan?: Date): Observable<Sendable> {
        const $sendables = this.core.messagesOn(this.messagesPath(), newerThan, this.config.messageHistoryLimit)
        $sendables.forEach(sendable => {
            if (sendable) {
                this.getEvents().getSendables().next(sendable)
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
    messagesOnce(fromDate?: Date, toDate?: Date, limit?: number): Observable<Sendable> {
        return this.core.messagesOnce(this.messagesPath(), fromDate, toDate, limit)
    }

    /**
     * This method gets the date of the last delivery receipt that we sent - i.e. the
     * last message WE received.
     * @return single date
     */
    protected async dateOfLastDeliveryReceipt(): Promise<Date> {
        return this.core.dateOfLastSentMessage(this.messagesPath())
    }

    /**
     * Listen for changes in the value of a list reference
     * @param path to listen to
     * @return events of list events
     */
    protected listChangeOn(path: Path): Observable<ListEvent> {
        return this.core.listChangeOn(path)
    }

    /**
     * Send a message to a messages ref
     * @param messagesPath
     * @param sendable item to be sent
     * @param newId the ID of the new message
     * @return single containing message id
     */
    sendToPath(messagesPath: Path, sendable: Sendable, newId?: string): Promise<void> {
        return this.core.send(messagesPath, sendable, newId)
    }

    /**
     * Delete a sendable from our queue
     * @param messagesPath
     * @return completion
     */
    protected deleteSendableAtPath(messagesPath: Path): Promise<void> {
        return this.core.deleteSendable(messagesPath)
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
        return this.core.removeUsers(path, users)
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
        return this.core.addUsers(path, dataProvider, users)
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
        return this.core.updateUsers(path, dataProvider, users)
    }

    /**
     * Connect to the chat
     * @throws Exception error if we are not connected
     */
    async connect(): Promise<void> {
        const date =  await this.dateOfLastDeliveryReceipt()
        this.messagesOn(date).subscribe(this.passMessageResultToStream.bind(this), this.error)
    }

    /**
     * Disconnect from a chat
     */
    disconnect() {
        this.dl.dispose()
    }

    /**
     * Convenience method to cast sendables and send them to the correct events
     * @param sendable the base sendable
     */
    protected passMessageResultToStream(sendable: Sendable) {

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

    /**
     * returns the events object which exposes the different sendable streams
     * @return events
     */
    getEvents(): Events {
        return this.events
    }

    /**
     * Overridable messages reference
     * @return Firestore messages reference
     */
    protected abstract messagesPath(): Path

}