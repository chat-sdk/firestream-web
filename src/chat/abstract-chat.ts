import * as firebase from 'firebase/app'
import 'firebase/firestore'

import { Sendable } from '../message/sendable'
import { DisposableList } from '../rx/disposable-list'
import { Events } from './events'
import { Config } from '../config'
import { Observable, from } from 'rxjs'
import { Keys } from '../firestore/keys'
import { SendableType } from '../types/sendable-types'
import { Fireflyy } from '../fireflyy'
import { ListEvent } from '../events/list-event'
import { Event } from '../events/event'
import { Paths } from '../firestore/paths'
import { User, DataProvider } from '../user'

class MessageResult {

    sendable: Sendable
    snapshot: firebase.firestore.DocumentSnapshot

    constructor(snapshot: firebase.firestore.DocumentSnapshot, sendable: Sendable) {
        this.sendable = sendable
        this.snapshot = snapshot
    }

}

export abstract class AbstractChat {

    /**
     * Firestore listener registrations - so we can remove listeners on logout
     */
    protected listenerRegistrations = new Array<() => void>()

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
     * Error handler method so we can redirect all errors to the error events
     * @param throwable - the events error
     * @throws Exception
     */
    accept(err: any) {
        // events.errors.onError(throwable)
    }

    /**
     * Start listening to the current message reference and retrieve all messages
     * @return a events of message results
     */
    protected messagesOn(): Observable<MessageResult>
    /**
     * Start listening to the current message reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of message results
     */
    protected messagesOn(newerThan: Date): Observable<MessageResult>
    protected messagesOn(newerThan?: Date): Observable<MessageResult> {
        return new Observable<MessageResult>(emitter => {
            let query = this.messagesRef().orderBy(Keys.Date, 'asc')
            if (newerThan) {
                query = query.where(Keys.Date, '>', newerThan)
            }
            query.limit(this.config.messageHistoryLimit)

            this.listenerRegistrations.push(query.onSnapshot(snapshot => {
                if (snapshot) {
                    for (const dc of snapshot.docChanges()) {
                        const ds = dc.doc
                        // Add the message
                        if (dc.type === 'added') {
                            const mr = this.messageResultFromSnapshot(ds)
                            if (mr) {
                                this.getEvents().getSendables().next(mr.sendable)
                                this.sendables.push(mr.sendable)
                            }
                            emitter.next(mr)
                        }
                    }
                }
            }, err => {
                this.events.impl_throwablePublishSubject().next(err)
            }))
        })
    }

    /**
     * Convert a snapshot to a message result
     * @param snapshot Firestore snapshot
     * @return message result
     */
    messageResultFromSnapshot(snapshot: firebase.firestore.DocumentSnapshot): MessageResult | undefined {
        if (snapshot.exists) {
            const sendable = snapshot.data() as (Sendable | undefined)
            if (sendable) {
                sendable.id = snapshot.id
                return new MessageResult(snapshot, sendable)
            }
        }
    }

    /**
     * Get a batch of messages once
     * @param fromDate get messages from this date
     * @param toDate get messages until this date
     * @param limit limit the maximum number of messages
     * @return a events of message results
     */
    messagesOnce(fromDate: Date, toDate: Date, limit: number): Observable<MessageResult> {
        return new Observable<MessageResult>(emitter => {
            let query = this.messagesRef().orderBy(Keys.Date, 'asc')
            if (fromDate) {
                query = query.where(Keys.Date, '>', fromDate)
            }
            if (toDate) {
                query = query.where(Keys.Date, '<', toDate)
            }
            if (limit) {
                query = query.limit(limit)
            }

            query.get()
                .then(snapshot => {
                    if (snapshot) {
                        for (const dc of snapshot.docChanges()) {
                            const ds = dc.doc
                            // Add the message
                            if (dc.type === 'added') {
                                const mr = this.messageResultFromSnapshot(ds)
                                emitter.next(mr)
                            }
                        }
                    }
                })
                .catch(emitter.error)
        })
    }

    /**
     * This method gets the date of the last delivery receipt that we sent - i.e. the
     * last message WE received.
     * @return single date
     */
    protected async dateOfLastDeliveryReceipt(): Promise<Date> {
        let query = this.messagesRef().where(Keys.Type, '==', SendableType.DeliveryReceipt)

        query = query.where(Keys.From, '==', Fireflyy.shared().currentUserId())
        query = query.orderBy(Keys.Date, 'desc')
        query = query.limit(1)

        const snapshot = await query.get()
        if (snapshot.docChanges().length > 0) {
            const change = snapshot.docChanges()[0]
            if (change.doc.exists) {
                const sendable = change.doc.data() as (Sendable | undefined)
                if (sendable) {
                    return sendable?.getDate()
                }
            }
        }

        throw new Error('Could not get date of last delivery receipt')
    }

    /**
     * Listen for changes in the value of a list reference
     * @param ref the Firestore ref to listen to
     * @return events of list events
     */
    protected listChangeOn(ref: firebase.firestore.CollectionReference): Observable<ListEvent> {
        return new Observable<ListEvent>(emitter => {
            this.listenerRegistrations.push(ref.onSnapshot(snapshot => {
                if (snapshot) {
                    for (const dc of snapshot.docChanges()) {
                        const ds =  dc.doc
                        if (ds.exists) {
                            const type = Event.typeForDocumentChange(dc)
                            emitter.next(new ListEvent(ds.id, ds.data(), type))
                        }
                    }
                }
            }, emitter.error))
        })
    }

    /**
     * Send a message to a messages ref
     * @param messagesRef Firestore reference for message collection
     * @param sendable item to be sent
     * @return single containing message id
     */
    async sendToRef(messagesRef: firebase.firestore.CollectionReference, sendable: Sendable): Promise<string> {
        const ref = await messagesRef.add(sendable)
        if (ref) {
            return ref.id
        } else {
            throw new Error('Message ID null')
        }
    }

    /**
     * Delete a sendable from our queue
     * @param messagesRef Firestore reference for message collection
     * @return completion
     */
    protected deleteSendable(messagesRef: firebase.firestore.DocumentReference): Promise<void> {
        return messagesRef.delete()
    }

    /**
     * Remove a user from a reference
     * @param ref Firestore reference for users
     * @param user to remove
     * @return completion
     */
    protected removeUser(ref: firebase.firestore.CollectionReference, user: User): Promise<void> {
        return this.removeUsers(ref, [user])
    }

    /**
     * Remove users from a reference
     * @param ref Firestore reference for users
     * @param users to remove
     * @return completion
     */
    protected removeUsers(ref: firebase.firestore.CollectionReference, users: Array<User>): Promise<void> {
        const batch = Paths.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.id)
            batch.delete(docRef)
        }

        return this.runBatch(batch)
    }

    /**
     * Add a user to a reference
     * @param ref Firestore reference for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param user to add
     * @return completion
     */
    protected addUser(ref: firebase.firestore.CollectionReference, dataProvider: DataProvider, user: User): Promise<void> {
        dataProvider
        return this.addUsers(ref, dataProvider, [user])
    }

    /**
     * Add users to a reference
     * @param ref Firestore reference for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param users to add
     * @return completion
     */
    public addUsers(ref: firebase.firestore.CollectionReference, dataProvider: DataProvider, users: Array<User>): Promise<void> {
        const batch = Paths.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.id)
            batch.set(docRef, dataProvider.data(user))
        }

        return this.runBatch(batch)
    }

    /**
     * Updates a user for a reference
     * @param ref Firestore reference for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param user to update
     * @return completion
     */
    updateUser(ref: firebase.firestore.CollectionReference, dataProvider: DataProvider, user: User): Promise<void> {
        return this.updateUsers(ref, dataProvider, [user])
    }

    /**
     * Update users for a reference
     * @param ref Firestore reference for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param users to update
     * @return completion
     */
    updateUsers(ref: firebase.firestore.CollectionReference, dataProvider: DataProvider, users: Array<User>): Promise<void> {
        const batch = Paths.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.id)
            const updateData = dataProvider.data(user)
            if (updateData) {
                batch.update(docRef, updateData)
            }
        }

        return this.runBatch(batch)
    }

    /**
     * Run a Firestore batch operation
     * @param batch Firestore batch
     * @return completion
     */
    protected runBatch(batch: firebase.firestore.WriteBatch): Promise<void> {
        return batch.commit()
    }

    /**
     * Send a sendable
     * @param toUserId user to send the message to
     * @param sendable item to send
     * @return single with message Id
     */
    abstract send(toUserId: string, sendable: Sendable): Promise<string>

    /**
     * Connect to the chat
     * @throws Exception error if we are not connected
     */
    async connect() {
        console.warn('FIREFLYY: connect()')
    }

    /**
     * Disconnect from a chat
     */
    disconnect() {
        console.warn('FIREFLYY: disconnect()')
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
    protected abstract messagesRef(): firebase.firestore.CollectionReference

}