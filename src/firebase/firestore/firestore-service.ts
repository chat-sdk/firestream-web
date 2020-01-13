import { app } from 'firebase'

import { FirebaseService } from '../service/firebase-service'
import { FirestoreChatHandler } from './firestore-chat-handler'
import { FirestoreCoreHandler } from './firestore-core-handler'

export class FirestoreService extends FirebaseService {

    constructor(app: app.App) {
        super()
        this._core = new FirestoreCoreHandler(app)
        this._chat = new FirestoreChatHandler()
    }

}
