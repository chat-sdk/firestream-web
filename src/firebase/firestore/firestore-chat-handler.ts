import { Observable } from 'rxjs'
import { map, filter } from 'rxjs/operators'

import { FirebaseChatHandler } from '../service/firebase-chat-handler'
import { RxFirestore } from './rx-firestore'
import { Ref } from './ref'
import { Paths } from '../service/paths'
import { Path } from '../service/path'
import { User } from '../../chat/user'
import { Keys } from '../service/keys'
import { IJson } from '../../interfaces/json'
import { Generic } from '../generic/generic'

export class FirestoreChatHandler extends FirebaseChatHandler {

    leaveChat(chatId: string): Promise<void> {
        return new RxFirestore().delete(Ref.document(Paths.userGroupChatPath(chatId)))
    }

    joinChat(chatId: string): Promise<void> {
        return new RxFirestore().set(Ref.document(Paths.userGroupChatPath(chatId)), User.dateDataProvider().data())
    }

    metaOn(path: Path): Observable<Generic.UserMetaData> {
        return new RxFirestore().on(Ref.document(path)).pipe(map(snapshot => {
            const data = snapshot.data() as Generic.UserMetaData
            if (data) {
                const meta = data[Keys.Meta]
                if (typeof meta === 'object') {
                    return meta
                }
            }
            return null
        }), filter(s => !!s)) as Observable<Generic.UserMetaData>
    }

    async add(path: Path, data: IJson): Promise<string> {
        const ref = await new RxFirestore().add(Ref.collection(path), data)
        return ref.id
    }

}
