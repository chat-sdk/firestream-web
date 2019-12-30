import { FirebaseService } from '../service/firebase-service'
import { FirestoreCoreHandler } from './firestore-core-handler'
import { FirestoreChatHandler } from './firestore-chat-handler'

export class FirestoreService extends FirebaseService {

    constructor() {
        super()
        this.core = new FirestoreCoreHandler()
        this.chat = new FirestoreChatHandler()
    }

}
