import * as firebase from 'firebase/app'
import { Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'

import { DataProvider, User } from '../../chat/user'
import { EventType } from '../../events/event-type'
import { ListEvent } from '../../events/list-event'
import { SendableEvent } from '../../events/sendable-event'
import { Consumer } from '../../interfaces/consumer'
import { ISendable } from '../../interfaces/sendable'
import { Sendable } from '../../message/sendable'
import { FirebaseCoreHandler } from '../service/firebase-core-handler'
import { Keys } from '../service/keys'
import { Path } from '../service/path'
import { Ref } from './ref'
import { RxFirestore } from './rx-firestore'

export class FirestoreCoreHandler extends FirebaseCoreHandler {

    private firebaseApp: firebase.app.App

    constructor(firebaseApp: firebase.app.App) {
        super()
        this.firebaseApp = firebaseApp
    }

    listChangeOn(path: Path): Observable<ListEvent> {
        return new RxFirestore().onQuery(Ref.collection(path)).pipe(map(change => {
            const ds = change.doc
            if (ds.exists) {
                const type = FirestoreCoreHandler.typeForDocumentChange(change)
                return new ListEvent(ds.id, ds.data({ serverTimestamps: 'estimate' }), type)
            }
        }), filter(c => !!c)) as Observable<ListEvent>
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
            const docRef = ref.doc(user.id)
            batch.set(docRef, dataProvider.data(user))
        }

        return this.runBatch(batch)
    }

    updateUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        const ref = Ref.collection(path)
        const batch = Ref.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.id)
            batch.update(docRef, dataProvider.data(user))
        }

        return this.runBatch(batch)
    }

    removeUsers(path: Path, users: User[]): Promise<void> {
        const ref = Ref.collection(path)
        const batch = Ref.db().batch()

        for (const user of users) {
            const docRef = ref.doc(user.id)
            batch.delete(docRef)
        }

        return this.runBatch(batch)
    }

    async loadMoreMessages(messagesPath: Path, fromDate: Date, toDate: Date, limit?: number): Promise<ISendable[]> {
        let query = Ref.collection(messagesPath) as firebase.firestore.Query

        query = query.orderBy(Keys.Date, 'asc')
        if (fromDate) {
            query = query.where(Keys.Date, '>', fromDate)
        }
        if (toDate) {
            query = query.where(Keys.Date, '<=', toDate)
        }

        if (limit) {
            if (fromDate) {
                query = query.limit(limit)
            }
            if (toDate) {
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
                    const sendable = new Sendable(docSnapshot.id, docSnapshot.data())
                    sendables.push(sendable)
                }
            }
        }
        return sendables
    }

    async dateOfLastSentMessage(messagesPath: Path): Promise<Date> {
        let query = Ref.collection(messagesPath) as firebase.firestore.Query

        query = query.where(Keys.From, '==', this.firebaseApp.auth().currentUser?.uid)
        query = query.orderBy(Keys.Date, 'desc')
        query = query.limit(1)

        const snapshot = await new RxFirestore().get(query)

        if (!snapshot.empty) {
            const changes = snapshot.docChanges()
            if (changes.length > 0) {
                const change = changes[0]
                if (change.doc.exists) {
                    const sendable = new Sendable('id', change.doc.data())
                    return sendable.getDate()
                }
            }
        }

        return new Date(0)
    }

    /**
     * Start listening to the current errorMessage reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of errorMessage results
     */
    messagesOn(messagesPath: Path, newerThan: Date, limit: number): Observable<SendableEvent> {
        let query = Ref.collection(messagesPath) as firebase.firestore.Query

        query = query.orderBy(Keys.Date, 'asc')
        if (newerThan != null) {
            query = query.where(Keys.Date, '>', newerThan)
        }
        query.limit(limit)

        const $docChanges = new RxFirestore().onQuery(query)
        const $sendableEvents = $docChanges.pipe(map(docChange => {
            const docSnapshot = docChange.doc
            if (docSnapshot.exists) {
                const sendable = new Sendable(docSnapshot.id, docSnapshot.data({ serverTimestamps: 'estimate' }))
                return new SendableEvent(sendable, FirestoreCoreHandler.typeForDocumentChange(docChange))
            }
        }))
        return $sendableEvents.pipe(filter(s => !!s)) as Observable<SendableEvent>
    }

    timestamp() {
        // TODO: This should return firebase.firestore.FieldValue.serverTimestamp().
        // At the monent this would cause an exeption when trying to push data (including the timestamp)
        // to Firestotre: `DocumentReference.set({ date: firebase.firestore.FieldValue.serverTimestamp() })`
        return new Date()
    }

    /**
     * Firestore helper methods
     */

    /**
     * Run a Firestore batch operation
     * @param batch Firestore batch
     * @return completion
     */
    protected runBatch(batch: firebase.firestore.WriteBatch): Promise<void> {
        return batch.commit()
    }

    static typeForDocumentChange(change: firebase.firestore.DocumentChange): EventType {
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
