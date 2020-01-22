import { app, User } from 'firebase/app'

import { FireStreamStore } from '../../firestream-store'
import { FirestoreChatHandler } from '../firestore/firestore-chat-handler'
import { FirestoreCoreHandler } from '../firestore/firestore-core-handler'
import { FirebaseChatHandler } from './firebase-chat-handler'
import { FirebaseCoreHandler } from './firebase-core-handler'

export class FirebaseService {

    private static instance: FirebaseService

    protected _core?: FirebaseCoreHandler
    protected _chat?: FirebaseChatHandler

    static get shared() {
        if (!this.instance) {
            this.instance = new FirebaseService()
        }
        return this.instance
    }

    static set core(coreHandler: FirebaseCoreHandler) {
        this.shared._core = coreHandler
    }

    static get core(): FirebaseCoreHandler {
        if (!this.shared._core) {
            this.shared._core = new FirestoreCoreHandler(FireStreamStore.app!)
        }
        return this.shared._core
    }

    static set chat(chatHandler: FirebaseChatHandler) {
        this.shared._chat = chatHandler
    }

    static get chat(): FirebaseChatHandler {
        if (!this.shared._chat) {
            this.shared._chat = new FirestoreChatHandler()
        }
        return this.shared._chat
    }

}
