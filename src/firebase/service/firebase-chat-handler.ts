import { Observable } from 'rxjs'

import { Meta } from '../../chat/meta'
import { Consumer } from '../../interfaces/consumer'
import { IJson } from '../../interfaces/json'
import { Path } from './path'

export abstract class FirebaseChatHandler {

    abstract leaveChat(chatId: string): Promise<void>
    abstract joinChat(chatId: string): Promise<void>

    /**
     * Note in this case, we don't provide the path to the chat/meta
     * we provide it to the chat. This is because of differences between
     * Realtime and Firestore. The realtime database stores the data at
     *  - chat/meta/...
     * But in Firestore meta/... is stored as a field on the chat document
     * So we need to link to the chat document in both cases
     * @param chatPath path to chat document / entity
     * @return stream of data when chat meta changes
     */
    abstract metaOn(path: Path): Observable<Meta>

    abstract updateMeta(chatPath: Path, meta: IJson): Promise<void>

    abstract add(path: Path, data: IJson, newId?: Consumer<string>): Promise<string>

}
