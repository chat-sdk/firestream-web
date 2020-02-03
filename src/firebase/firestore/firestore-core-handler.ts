import { app, firestore } from 'firebase/app'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { DataProvider, User } from '../../chat/user'
import { Event } from '../../events'
import { EventType } from '../../events/event-type'
import { ListData } from '../../events/list-data'
import { Consumer } from '../../interfaces/consumer'
import { ISendable } from '../../interfaces/sendable'
import { Sendable } from '../../message/sendable'
import { RxUtils } from '../../utils/rx-utils'
import { FirebaseCoreHandler } from '../service/firebase-core-handler'
import { Keys } from '../service/keys'
import { Path } from '../service/path'
import { Ref } from './ref'
import { RxFirestore } from './rx-firestore'

export class FirestoreCoreHandler extends FirebaseCoreHandler {

    private firebaseApp: app.App

    constructor(firebaseApp: app.App) {
        super()
        this.firebaseApp = firebaseApp
    }

    listChangeOn(path: Path): Observable<Event<ListData>> {
        return new RxFirestore().onQuery(Ref.collection(path)).pipe(map(change => {
            const ds = change.doc
            if (ds.exists) {
                const type = FirestoreCoreHandler.typeForDocumentChange(change)
                return new Event(new ListData(ds.id, ds.data({ serverTimestamps: 'estimate' })), type)
            }
        }), RxUtils.filterTruthy)
    }

    deleteSendable (messagesPath: Path): Promise<void> {
        return new RxFirestore().delete(Ref.document(messagesPath))
    }

    async send(messagesPath: Path, sendable: ISendable, newId?: Consumer<string>): Promise<void> {
        await new RxFirestore().add(Ref.collection(messagesPath), sendable.toData(), newId)
    }

    addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        const ref = Ref.collection(path)
        const batch = Ref.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.getId())
            batch.set(docRef, dataProvider.data(user))
        }

        return this.runBatch(batch)
    }

    updateUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        const ref = Ref.collection(path)
        const batch = Ref.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.getId())
            batch.update(docRef, dataProvider.data(user))
        }

        return this.runBatch(batch)
    }

    removeUsers(path: Path, users: User[]): Promise<void> {
        const ref = Ref.collection(path)
        const batch = Ref.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.getId())
            batch.delete(docRef)
        }

        return this.runBatch(batch)
    }

    async loadMoreMessages(messagesPath: Path, fromDate: Date, toDate: Date, limit?: number): Promise<ISendable[]> {
        let query = Ref.collection(messagesPath) as firestore.Query

        query = query.orderBy(Keys.Date, 'asc')
        if (fromDate != null) {
            query = query.where(Keys.Date, '>', fromDate)
        }
        if (toDate != null) {
            query = query.where(Keys.Date, '<=', toDate)
        }

        if (limit != null) {
            if (fromDate != null) {
                query = query.limit(limit)
            }
            if (toDate != null) {
                query = query.limitToLast(limit)
            }
        }

        const querySnapshot = await new RxFirestore().get(query)
        const sendables = new Array<ISendable>()
        if (!querySnapshot.empty) {
            for (const docChange of querySnapshot.docChanges()) {
                const docSnapshot = docChange.doc
                // Add the message
                if (docSnapshot.exists && docChange.type === 'added') {
                    const sendable = this.sendableFromSnapshot(docSnapshot)
                    sendables.push(sendable)
                }
            }
        }
        return sendables
    }

    async dateOfLastSentMessage(messagesPath: Path): Promise<Date> {
        let query = Ref.collection(messagesPath) as firestore.Query

        query = query.where(Keys.From, '==', this.firebaseApp.auth().currentUser?.uid)
        query = query.orderBy(Keys.From, 'desc')
        query = query.limit(1)

        const snapshot = await new RxFirestore().get(query)

        if (!snapshot.empty) {
            const changes = snapshot.docChanges()
            if (changes.length > 0) {
                const change = changes[0]
                if (change.doc.exists) {
                    const sendable = this.sendableFromSnapshot(change.doc)
                    return sendable.getDate()
                }
            }
        }

        return new Date(0)
    }

    /**
     * Start listening to the current message reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of message results
     */
    messagesOn(messagesPath: Path, newerThan: Date, limit: number): Observable<Event<ISendable>> {
        let query = Ref.collection(messagesPath) as firestore.Query

        query = query.orderBy(Keys.Date, 'asc')
        if (newerThan != null) {
            query = query.where(Keys.Date, '>', newerThan)
        }
        query.limit(limit)

        return new RxFirestore().onQuery(query).pipe(map(docChange => {
            const docSnapshot = docChange.doc
            if (docSnapshot.exists) {
                const sendable = this.sendableFromSnapshot(docSnapshot)
                return new Event(sendable, FirestoreCoreHandler.typeForDocumentChange(docChange))
            }
        }), RxUtils.filterTruthy)
    }

    /**
     * Firestore helper methods
     */

    sendableFromSnapshot(snapshot: firestore.DocumentSnapshot): ISendable {
        const sendable = new Sendable()
        sendable.setId(snapshot.id)
        const from = snapshot.get(Keys.From)
        const timestamp = snapshot.get(Keys.Date, { serverTimestamps: 'estimate' })
        const body = snapshot.get(Keys.Body)
        const type = snapshot.get(Keys.Type)
        if (typeof from === 'string') {
            sendable.setFrom(from)
        }
        if (timestamp instanceof firestore.Timestamp) {
            sendable.setDate(timestamp.toDate())
        }
        if (typeof body === 'object') {
            sendable.setBody(body)
        }
        if (typeof type === 'string') {
            sendable.setType(type)
        }
        return sendable
    }

    /**
     * Run a Firestore batch operation
     * @param batch Firestore batch
     * @return completion
     */
    protected runBatch(batch: firestore.WriteBatch): Promise<void> {
        return batch.commit()
    }

    static typeForDocumentChange(change: firestore.DocumentChange): EventType {
        switch (change.type) {
            case 'added':
                return EventType.Added
            case 'removed':
                return EventType.Removed
            case 'modified':
                return EventType.Modified
            default:
                return EventType.None
        }
    }

}
