import { database } from 'firebase/app'
import { Observable } from 'rxjs'

import { EventType } from '../../events'
import { Consumer } from '../../interfaces/consumer'
import { IJsonObject } from '../../interfaces/json'
import { expect } from '../../utils/expect'

type TValueEventListener = (a: database.DataSnapshot | null) => any

export class RxRealtime {

    protected valueListener?: TValueEventListener
    protected childAddedListener?: TValueEventListener
    protected childRemovedListener?: TValueEventListener
    protected childCahngedListener?: TValueEventListener
    protected ref?: database.Query

    on(ref: database.Query): Observable<RxRealtime.DocumentChange> {
        return new Observable(emitter => {
            this.ref = ref
            this.valueListener = ref.on('value', snapshot => {
                if (snapshot.exists && snapshot.val()) {
                    emitter.next(new RxRealtime.DocumentChange(snapshot))
                }
            })
        })
    }

    childOn(ref: database.Query): Observable<RxRealtime.DocumentChange> {
        return new Observable(emitter => {
            this.ref = ref
            this.childAddedListener = ref.on('child_added', snapshot => {
                emitter.next(new RxRealtime.DocumentChange(snapshot, EventType.Added))
            }, emitter.error)
            this.childRemovedListener = ref.on('child_removed', snapshot => {
                emitter.next(new RxRealtime.DocumentChange(snapshot, EventType.Removed))
            }, emitter.error)
            this.childCahngedListener = ref.on('child_changed', snapshot => {
                emitter.next(new RxRealtime.DocumentChange(snapshot, EventType.Modified))
            }, emitter.error)
        })
    }

    async add(ref: database.Reference, data: IJsonObject, priority?: any, newId?: Consumer<string>): Promise<string> {
        const childRef = ref.push()
        const id = expect(childRef.key, 'RxRealtime > add() > childRef.key')
        if (newId) {
            newId(id)
        }
        if (priority != null) {
            await childRef.setWithPriority(data, priority)
        } else {
            await childRef.set(data)
        }
        return id
    }

    delete(ref: database.Reference): Promise<void> {
        return ref.remove()
    }

    set(ref: database.Reference, data: IJsonObject): Promise<void> {
        return ref.set(data)
    }

    update(ref: database.Reference, data: IJsonObject): Promise<void> {
        return ref.update(data)
    }

    get(ref: database.Query): Promise<database.DataSnapshot | undefined> {
        return new Promise((resolve, reject) => {
            ref.once('value', snapshot => {
                if (snapshot.exists && snapshot.val()) {
                    resolve(snapshot)
                } else {
                    resolve()
                }
            }, reject)
        })
    }

    run() {
        if (this.ref) {
            if (this.childAddedListener) {
                // ref.removeEventListener(childListener);
            }
            if (this.childCahngedListener) {
                // ref.removeEventListener(childListener);
            }
            if (this.childRemovedListener) {
                // ref.removeEventListener(childListener);
            }
            if (this.valueListener) {
                // this.ref.removeEventListener(valueListener);
            }
        }
        this.ref = undefined
        this.childAddedListener = undefined
        this.childCahngedListener = undefined
        this.childRemovedListener = undefined
        this.valueListener = undefined
    }
}

export namespace RxRealtime {

    export class DocumentChange {
        snapshot: database.DataSnapshot
        type?: EventType

        constructor(snapshot: database.DataSnapshot, type?: EventType) {
            this.snapshot = snapshot;
            this.type = type;
        }
    }

}
