import { FirebaseService } from '../service/firebase-service'
import { FirestoreChatHandler } from './firestore-chat-handler'
import { FirestoreCoreHandler } from './firestore-core-handler'

export class FirestoreService extends FirebaseService {

    constructor() {
        super()
        this.core = new FirestoreCoreHandler()
        this.chat = new FirestoreChatHandler()
    }

}
