import { Keys } from './keys'
import { Path } from './path'
import { Firefly } from '../../firefly'

export class Paths extends Keys {

    static root(): Path {
        return new Path([Firefly.shared().getConfig().root, Firefly.shared().getConfig().sandbox])
    }

    static usersPath(): Path {
        return this.root().child(this.Users);
    }

    static userPath(uid?: string): Path {
        return this.usersPath().child(uid || this.currentUserId())
    }

    static messagesPath(uid?: string): Path {
        return this.userPath(uid || this.currentUserId()).child(this.Messages)
    }

    static userGroupChatsPath(): Path {
        return this.userPath(this.currentUserId()).child(Keys.Chats)
    }

    static userGroupChatPath(chatId: string): Path {
        return this.userGroupChatsPath().child(chatId)
    }

    static messagePath(messageId: string): Path
    static messagePath(uid: string, messageId: string): Path
    static messagePath(arg1: string, arg2?: string): Path {
        if (arg2) {
            return this.messagesPath(arg1).child(arg2)
        } else {
            return this.messagePath(this.currentUserId(), arg1)
        }
    }

    protected static currentUserId(): string {
        const uid = Firefly.shared().currentUserId()
        if (!uid) {
            throw new Error('User not authenticated')
        }
        return uid
    }

    static contactsPath(): Path {
        return this.userPath().child(this.Contacts)
    }

    static blockedPath(): Path {
        return this.userPath().child(this.Blocked)
    }

    static chatsPath(): Path {
        return this.root().child(this.Chats)
    }

    static groupChatPath(chatId: string): Path {
        return this.chatsPath().child(chatId)
    }

    static groupChatMetaPath(chatId: string): Path {
        return this.chatsPath().child(chatId).child(this.Meta)
    }

    static groupChatMessagesPath(chatId: string): Path {
        return this.groupChatPath(chatId).child(this.Messages)
    }

    static groupChatUsersPath(chatId: string): Path {
        return this.groupChatPath(chatId).child(this.Users)
    }

}
