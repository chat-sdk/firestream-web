import 'firebase/firestore'

import * as firebase from 'firebase/app'
import { Observable } from 'rxjs'

import { Consumer } from '../../interfaces/consumer'

export class RxFirestore {

    protected unsubscribe?: () => void

    on(ref: firebase.firestore.DocumentReference): Observable<firebase.firestore.DocumentSnapshot> {
        return new Observable(emitter => {
            this.unsubscribe = ref.onSnapshot(snapshot => {
                if (snapshot) {
                    emitter.next(snapshot)
                }
            }, emitter.error)
        })
    }

    onQuery(ref: firebase.firestore.Query): Observable<firebase.firestore.DocumentChange> {
        return new Observable(emitter => {
            this.unsubscribe = ref.onSnapshot(snapshot => {
                if (snapshot) {
                    for (const docChange of snapshot.docChanges()) {
                        emitter.next(docChange)
                    }
                }
            }, emitter.error)
        })
    }

    async add(ref: firebase.firestore.CollectionReference, data: firebase.firestore.DocumentData, newId?: Consumer<string>): Promise<string> {
        const docRef = ref.doc()
        if (newId) {
            newId(docRef.id)
        }
        await docRef.set(data)
        return docRef.id
    }

    delete(ref: firebase.firestore.DocumentReference): Promise<void> {
        return ref.delete()
    }

    set(ref: firebase.firestore.DocumentReference, data: firebase.firestore.DocumentData): Promise<void> {
        return ref.set(data)
    }

    update(ref: firebase.firestore.DocumentReference, data: firebase.firestore.DocumentData): Promise<void> {
        return ref.update(data)
    }

    get(ref: firebase.firestore.DocumentReference): Promise<firebase.firestore.DocumentSnapshot>
    get(ref: firebase.firestore.Query): Promise<firebase.firestore.QuerySnapshot>
    get(ref: firebase.firestore.DocumentReference | firebase.firestore.Query): Promise<firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot> {
        return ref.get()
    }

    run() {
        this.unsubscribe?.()
    }

}
