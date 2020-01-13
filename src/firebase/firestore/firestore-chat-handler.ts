import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { Meta } from '../../chat/meta'
import { User } from '../../chat/user'
import { Consumer } from '../../interfaces/consumer'
import { IJson } from '../../interfaces/json'
import { FirebaseChatHandler } from '../service/firebase-chat-handler'
import { Keys } from '../service/keys'
import { Path } from '../service/path'
import { Paths } from '../service/paths'
import { Ref } from './ref'
import { RxFirestore } from './rx-firestore'

export class FirestoreChatHandler extends FirebaseChatHandler {

    leaveChat(chatId: string): Promise<void> {
        return new RxFirestore().delete(Ref.document(Paths.userGroupChatPath(chatId)))
    }

    joinChat(chatId: string): Promise<void> {
        return new RxFirestore().set(Ref.document(Paths.userGroupChatPath(chatId)), User.dateDataProvider().data())
    }

    updateMeta(chatMetaPath: Path, meta: IJson): Promise<void> {
        chatMetaPath.normalizeForDocument()

        const keys = Object.keys(meta)

        let toWrite: IJson = { ...meta }
        const remainder = chatMetaPath.getRemainder()
        if (remainder) {
            toWrite = this.wrap(remainder, meta);
            keys.push(remainder)
        }
        return new RxFirestore().update(Ref.document(chatMetaPath), toWrite, keys)
    }

    protected wrap(key: string, map: IJson): IJson {
        return {
            [key]: map
        }
    }

    metaOn(path: Path): Observable<Meta> {
        return new RxFirestore().on(Ref.document(path)).pipe(map(snapshot => {
            const meta = new Meta()

            const base = Keys.Meta + '.'

            meta.setName(snapshot.get(base + Keys.Name))
            meta.setCreated(snapshot.get(base + Keys.Created))
            meta.setImageURL(snapshot.get(base + Keys.ImageURL))
            meta.setData(snapshot.get(base + Keys.Data))

            return meta
        }))
    }

    async add(path: Path, data: IJson, newId?: Consumer<string>): Promise<string> {
        return new RxFirestore().add(Ref.collection(path), data, newId)
    }

}
