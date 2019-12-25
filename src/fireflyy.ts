import * as firebase from 'firebase/app'
import 'firebase/auth'

import { Config } from './config'
import { Paths } from './firestore/paths'
import { AbstractChat } from './chat/abstract-chat'
import { Sendable } from './message/sendable'
import { TextMessage } from './message/text-message'

export class Fireflyy extends AbstractChat {

    private static instance: Fireflyy

    user?: firebase.User

    static shared() {
        if (!this.instance) {
            this.instance = new Fireflyy()
        }
        return this.instance
    }

    initialize(app: firebase.app.App, config?: Config) {
        app.auth().onAuthStateChanged(async user => {
            this.user = user || undefined
            if (user) {
                try {
                    await this.connect()
                } catch (err) {
                    console.error(err)
                }
            } else {
                this.disconnect()
            }
        }, error => {
            console.error(error)
        })
    }

    async connect() {
        this.disconnect()
        console.warn('FIREFLYY: connect()')
    }

    currentUserId(): string | undefined {
        return this.user?.uid
    }

    // public Completable deleteSendable (Sendable sendable)

    // public Single<String> sendPresence(String userId, PresenceType type)

    // public Single<String> sendInvitation(String userId, InvitationType type, String groupId)

    send(toUserId: string, sendable: Sendable): Promise<string> {
        return super.sendToRef(Paths.messagesRef(toUserId), sendable)
    }

    // public Single<String> sendDeliveryReceipt(String userId, DeliveryReceiptType type, String messageId)

    // public Single<String> sendTypingIndicator(String userId, TypingStateType type)

    async sendMessageWithText(userId: string, text: string): Promise<string> {
        return this.send(userId, new TextMessage(text))
    }

    protected messagesRef(): firebase.firestore.CollectionReference {
        return Paths.messagesRef()
    }

}

export { Fire } from './namespace/fire'
export { Fly } from './namespace/fly'
