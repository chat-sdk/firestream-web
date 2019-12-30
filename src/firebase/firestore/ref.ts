import { firestore } from 'firebase/app'

import { Path } from '../service/path'
import { Firefly } from '../../firefly'

export class Ref {

    static collection(path: Path): firestore.CollectionReference {
        let ref = this.db().collection(path.first())
        for (let i = 1; i < path.size(); i += 2) {
            const c1 = path.get(i)
            const c2 = path.get(i+1)
            if (c1 && c2) {
                ref = ref.doc(c1).collection(c2)
            }
        }
        return ref
    }

    static document(path: Path): firestore.DocumentReference {
        return this.collection(path).doc(path.last())
    }

    static db(): firestore.Firestore {
        return Firefly.shared().firebaseApp.firestore()
    }

}
