import { Observable } from 'rxjs'

import { Path } from './path'
import { ChatMeta } from '../../chat/chat'
import { IJson } from '../../interfaces/json'
import { Consumer } from '../../interfaces/consumer'

export abstract class FirebaseChatHandler {

    abstract leaveChat(chatId: string): Promise<void>
    abstract joinChat(chatId: string): Promise<void>
    abstract metaOn(path: Path): Observable<ChatMeta>
    abstract add(path: Path, data: IJson, newId?: Consumer<string>): Promise<string>

}
