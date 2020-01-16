import { firestore } from 'firebase/app'

import { FireStreamStore } from '../../firestream-store'
import { Path } from '../service/path'

export class Ref {

    static collection(path: Path): firestore.CollectionReference {
        const ref = this.referenceFromPath(path)
        if (ref instanceof firestore.CollectionReference) {
            return ref
        } else {
            FireStreamStore.debug('CollectionReference expected but path points to document')
            throw new Error('CollectionReference expected but path points to document')
        }
    }

    static document(path: Path): firestore.DocumentReference {
        const ref = this.referenceFromPath(path)
        if (ref instanceof firestore.DocumentReference) {
            return ref
        } else {
            FireStreamStore.debug('DocumentReference expected but path points to collection')
            throw new Error('DocumentReference expected but path points to collection')
        }
    }

    static referenceFromPath(path: Path): firestore.DocumentReference | firestore.CollectionReference {
        let ref: firestore.DocumentReference | firestore.CollectionReference = this.db().collection(path.first())
        for (let i = 1; i < path.size(); i++) {
            const component = path.get(i)
            if (!component) continue
            if (ref instanceof firestore.DocumentReference) {
                ref = ref.collection(component)
            } else if (ref instanceof firestore.CollectionReference) {
                ref = ref.doc(component)
            }
        }
        return ref
    }

    static db(): firestore.Firestore {
        const app = FireStreamStore.app
        if (!app) {
            throw new Error('FireStreamStore.app returned undefined')
        }
        return app.firestore()
    }

}
