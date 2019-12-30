import { firestore } from 'firebase/app'
import { Observable } from 'rxjs'

export class RxFirestore {

    protected unsubscribe?: () => void

    on(ref: firestore.DocumentReference): Observable<firestore.DocumentSnapshot> {
        return new Observable(emitter => {
            this.unsubscribe = ref.onSnapshot(snapshot => {
                if (snapshot && snapshot.exists) {
                    emitter.next(snapshot)
                } else {
                    // emitter.onError(new Throwable(Fly.y.context().getString(R.string.error_null_snapshot)));
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

    add(ref: firestore.CollectionReference, data: firestore.DocumentData): Promise<firestore.DocumentReference> {
        return ref.add(data)
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
