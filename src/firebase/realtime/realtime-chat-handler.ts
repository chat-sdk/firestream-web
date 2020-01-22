import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { Meta, User } from '../../chat'
import { Consumer } from '../../interfaces/consumer'
import { IJsonObject } from '../../interfaces/json'
import { RxUtils } from '../../utils/rx-utils'
import { FirebaseChatHandler } from '../service/firebase-chat-handler'
import { Keys } from '../service/keys'
import { Paths } from '../service/paths'
import { Ref } from './ref'
import { RxRealtime } from './rx-realtime'

export class RealtimeChatHandler extends FirebaseChatHandler {

    leaveChat(chatId: string): Promise<void> {
        return new RxRealtime().delete(Ref.get(Paths.userGroupChatPath(chatId)))
    }

    joinChat(chatId: string): Promise<void> {
        return new RxRealtime().set(Ref.get(Paths.userGroupChatPath(chatId)), User.dateDataProvider().data())
    }

    setMetaField(chatId: string, key: string, value: IJsonObject): Promise<void> {
        return new RxRealtime().set(Ref.get(Paths.chatMetaPath(chatId).child(key)), value);
    }

    metaOn(chatId: string): Observable<Meta> {
        return new RxRealtime().on(Ref.get(Paths.chatPath(chatId))).pipe(map(change => {
            let snapshot = change.snapshot
            if (snapshot.hasChild(Keys.Meta)) {
                snapshot = snapshot.child(Keys.Meta);

                const meta = new Meta()

                if (snapshot.hasChild(Keys.Name)) {
                    meta.setName(snapshot.child(Keys.Name).val())
                }
                if (snapshot.hasChild(Keys.Created)) {
                    const date = snapshot.child(Keys.Created).val()
                    if (date != null) {
                        meta.setCreated(new Date(date))
                    }
                }
                if (snapshot.hasChild(Keys.ImageURL)) {
                    meta.setImageURL(snapshot.child(Keys.ImageURL).val())
                }
                if (snapshot.hasChild(Keys.Data)) {
                    const data = snapshot.child(Keys.Data).val()
                    meta.setData(data)
                }
                return meta
            }
        }), RxUtils.filterTruthy)
    }

    add(data: IJsonObject, newId?: Consumer<string>): Promise<string> {
        return new RxRealtime().add(Ref.get(Paths.chatsPath()), data, newId);
    }

    delete(chatId: string): Promise<void> {
        return new RxRealtime().delete(Ref.get(Paths.chatPath(chatId)));
    }

}
