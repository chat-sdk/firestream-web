import { firestore } from 'firebase/app'
import { Observable } from 'rxjs'

export class RxFirestore {

    protected unsubscribe?: () => void

    on(ref: firestore.DocumentReference): Observable<firestore.DocumentSnapshot> {
        return new Observable(emitter => {
            this.unsubscribe = ref.onSnapshot(snapshot => {
                if (snapshot) {
                    emitter.next(snapshot)
                }
            }, emitter.error)
        })
    }

    onQuery(ref: firestore.Query): Observable<firestore.DocumentChange> {
        return new Observable(emitter => {
            this.unsubscribe = ref.onSnapshot(snapshot => {
                if (snapshot) {
                    for (const dc of snapshot.docChanges()) {
                        emitter.next(dc)
                    }
                }
            }, emitter.error)
        })
    }

    async add(ref: firestore.CollectionReference, data: firestore.DocumentData, newId?: string): Promise<string> {
        const docRef = ref.doc(newId)
        await docRef.set(data)
        return docRef.id
    }

    delete(ref: firestore.DocumentReference): Promise<void> {
        return ref.delete()
    }

    set(ref: firestore.DocumentReference, data: firestore.DocumentData): Promise<void> {
        return ref.set(data)
    }

    get(ref: firestore.DocumentReference): Promise<firestore.DocumentSnapshot>
    get(ref: firestore.Query): Promise<firestore.QuerySnapshot>
    get(ref: firestore.DocumentReference | firestore.Query): Promise<firestore.DocumentSnapshot | firestore.QuerySnapshot> {
        return ref.get()
    }

    run() {
        this.unsubscribe?.()
    }

}
