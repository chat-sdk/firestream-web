import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { FirebaseChatHandler } from '../service/firebase-chat-handler'
import { RxFirestore } from './rx-firestore'
import { Ref } from './ref'
import { Paths } from '../service/paths'
import { Path } from '../service/path'
import { User } from '../../chat/user'
import { Keys } from '../service/keys'
import { IJson } from '../../interfaces/json'
import { ChatMeta } from '../../chat/chat'

export class FirestoreChatHandler extends FirebaseChatHandler {

    leaveChat(chatId: string): Promise<void> {
        return new RxFirestore().delete(Ref.document(Paths.userGroupChatPath(chatId)))
    }

    joinChat(chatId: string): Promise<void> {
        return new RxFirestore().set(Ref.document(Paths.userGroupChatPath(chatId)), User.dateDataProvider().data())
    }

    metaOn(path: Path): Observable<ChatMeta> {
        // Remove the last path because in this case, the document ref does not include the "meta keyword"
        return new RxFirestore().on(Ref.document(path)).pipe(map(snapshot => {
            const meta: ChatMeta = {
                name: snapshot.get(Keys.Name),
                created: snapshot.get(Keys.Created),
                avatarURL: snapshot.get(Keys.Avatar),
            }

            return meta
        }))
    }

    async add(path: Path, data: IJson, newId?: string): Promise<string> {
        return new RxFirestore().add(Ref.collection(path), data, newId)
    }

}
