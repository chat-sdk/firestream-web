import { firestore } from 'firebase/app'

import { FireStreamStore } from '../../firestream-store'
import { Path } from '../service/path'

export class Ref {

    static collection(path: Path): firestore.CollectionReference {
        const ref = this.referenceFromPath(path)
        if (ref instanceof firestore.CollectionReference) {
            return ref
        } else {
            throw new Error('error_mismatched_col_reference')
        }
    }

    static document(path: Path): firestore.DocumentReference {
        const ref = this.referenceFromPath(path)
        if (ref instanceof firestore.DocumentReference) {
            return ref
        } else {
            throw new Error('error_mismatched_col_reference')
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
