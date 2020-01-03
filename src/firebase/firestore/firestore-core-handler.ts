import * as firebase from 'firebase/app'
import { Observable } from 'rxjs'
import { map, filter } from 'rxjs/operators'

import { FirebaseCoreHandler } from '../service/firebase-core-handler'
import { Path } from '../service/path'
import { ListEvent } from '../../events/list-event'
import { RxFirestore } from './rx-firestore'
import { Ref } from './ref'
import { Sendable } from '../../message/sendable'
import { DataProvider, User } from '../../chat/user'
import { Keys } from '../service/keys'
import { Firefly } from '../../firefly'
import { EventType } from '../../events/event-type'
import { Consumer } from '../../interfaces/consumer'

export class FirestoreCoreHandler extends FirebaseCoreHandler {

    listChangeOn(path: Path): Observable<ListEvent> {
        return new RxFirestore().onQuery(Ref.collection(path)).pipe(map(change => {
            const ds = change.doc
            if (ds.exists) {
                const type = FirestoreCoreHandler.typeForDocumentChange(change)
                return new ListEvent(ds.id, ds.data(), type)
            }
        }), filter(c => !!c)) as Observable<ListEvent>
    }

    deleteSendable (messagesPath: Path): Promise<void> {
        return new RxFirestore().delete(Ref.document(messagesPath))
    }

    async send(messagesPath: Path, sendable: Sendable, newId?: Consumer<string>): Promise<void> {
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

    messagesOnce(messagesPath: Path, fromDate?: Date, toDate?: Date, limit?: number): Observable<Sendable> {
        let query = Ref.collection(messagesPath) as firebase.firestore.Query

        query = query.orderBy(Keys.Date, 'asc')
        if (fromDate) {
            query = query.where(Keys.Date, '>', fromDate);
        }
        if (toDate) {
            query = query.where(Keys.Date, '<', toDate);
        }
        if (limit) {
            query = query.limit(limit);
        }

        return new Observable<Sendable>(emitter => {
            (async () => {
                try {
                    const snapshot = await new RxFirestore().get(query)
                    if (snapshot) {
                        for (const dc of snapshot.docChanges()) {
                            const ds = dc.doc
                            // Add the message
                            if (ds.exists && dc.type === 'added') {
                                const sendable = new Sendable(ds.id, ds.data())
                                emitter.next(sendable)
                            }
                        }
                    }
                } catch (err) {
                    emitter.error(err)
                }
            })()
        })
    }

    async dateOfLastSentMessage(messagesPath: Path): Promise<Date> {
        let query = Ref.collection(messagesPath) as firebase.firestore.Query

        query = query.where(Keys.From, '==', Firefly.shared().currentUserId())
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
     * Start listening to the current message reference and pass the messages to the events
     * @param newerThan only listen for messages after this date
     * @return a events of message results
     */
    messagesOn(messagesPath: Path, newerThan: Date, limit: number): Observable<Sendable> {
        let query = Ref.collection(messagesPath) as firebase.firestore.Query

        query = query.orderBy(Keys.Date, 'asc')
        if (newerThan) {
            query = query.where(Keys.Date, '>', newerThan)
        }
        query.limit(limit)

        return new RxFirestore().onQuery(query)
            .pipe(map(change => {
                const ds = change.doc
                if (change.type === 'added') {
                    if (ds.exists) {
                        return new Sendable(ds.id, ds.data())
                    }
                }
            }))
            .pipe(filter(s => !!s)) as Observable<Sendable>
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
