import { app, User } from 'firebase/app'

import { FirestoreChatHandler } from '../firestore/firestore-chat-handler'
import { FirestoreCoreHandler } from '../firestore/firestore-core-handler'
import { FirebaseChatHandler } from './firebase-chat-handler'
import { FirebaseCoreHandler } from './firebase-core-handler'

export class FirebaseService {

    private static instance: FirebaseService

    private _app?: app.App

    protected _core?: FirebaseCoreHandler
    protected _chat?: FirebaseChatHandler

    static get shared() {
        if (!this.instance) {
            this.instance = new FirebaseService()
        }
        return this.instance
    }

    static setApp(app?: app.App) {
        this.shared._app = app!
    }

    static get app(): app.App | undefined {
        return this.shared._app
    }

    static get user(): User | undefined {
        return this.shared._app?.auth().currentUser || undefined
    }

    /**
     * Get the User ID of the currently authenticated user.
     * @throws if no user is authenticated
     */
    static get userId(): string {
        if (!this.user) {
            throw new Error('User is not authenticated')
        }
        return this.user.uid
    }

    static set core(coreHandler: FirebaseCoreHandler) {
        this.shared._core = coreHandler
    }

    static get core(): FirebaseCoreHandler {
        if (!this.shared._core) {
            this.shared._core = new FirestoreCoreHandler(this.app!)
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
