import * as firebase from 'firebase/app'

import { Fireflyy } from '../fireflyy'
import { Keys } from './keys'

export class Paths extends Keys {

    static db(): firebase.firestore.Firestore {
        return firebase.firestore()
    }

    static userRef(uid?: string): firebase.firestore.DocumentReference {
        if (uid) {
            return this.db().collection(this.Users).doc(uid)
        } else {
            return this.userRef(this.currentUid())
        }
    }

    static messagesRef(uid?: string): firebase.firestore.CollectionReference {
        if (uid) {
            return this.userRef(uid).collection(this.Messages)
        } else {
            return this.messagesRef(this.currentUid())
        }
    }

    static userGroupChatsRef(): firebase.firestore.CollectionReference {
        return this.userRef(this.currentUid()).collection(this.Chats)
    }

    static messageRef (uid: string, messageId: string): firebase.firestore.DocumentReference
    static messageRef (messageId: string): firebase.firestore.DocumentReference
    static messageRef (arg1: string, arg2?: string): firebase.firestore.DocumentReference {
        if (arg2) {
            return this.messagesRef(arg1).doc(arg2)
        } else {
            return this.messageRef(this.currentUid(), arg1)
        }
    }

    protected static currentUid(): string {
        const uid = Fireflyy.shared().currentUserId()
        if (typeof uid === 'string') {
            return uid
        } else {
            throw new Error('Fireflyy.shared().currentUserId() returned undefined')
        }
    }

    static contactsRef(): firebase.firestore.CollectionReference {
        return this.userRef().collection(this.Contacts)
    }

    static blockedRef(): firebase.firestore.CollectionReference {
        return this.userRef().collection(this.Blocked)
    }

    static groupChatsRef(): firebase.firestore.CollectionReference {
        return this.db().collection(this.Chats)
    }

    static groupChatRef(chatId: string): firebase.firestore.DocumentReference {
        return this.groupChatsRef().doc(chatId)
    }

    static groupChatMessagesRef(chatId: string): firebase.firestore.CollectionReference {
        return this.groupChatRef(chatId).collection(this.Messages)
    }

    static groupChatUsersRef(chatId: string): firebase.firestore.CollectionReference {
        return this.groupChatRef(chatId).collection(this.Users)
    }

}
