import { database } from 'firebase/app'

import { ErrorMessage } from '../../error-messages'
import { FireStreamStore } from '../../firestream-store'
import { Path } from '../service/path'

export class Ref {

    static get(path: Path): database.Reference {
        let ref = this.db().ref(path.first())
        for (let i = 1; i < path.size(); i++) {
            const component = path.get(i)
            if (component) {
                ref = ref.child(component)
            }
        }
        return ref
    }

    static db(): database.Database {
        const app = FireStreamStore.app
        if (!app) {
            throw new Error(ErrorMessage.null_firebase_app)
        }
        return app.database()
    }

}
