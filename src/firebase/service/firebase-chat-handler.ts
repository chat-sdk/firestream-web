import { Observable } from 'rxjs'

import { Path } from './path'
import { IJson } from '../../interfaces/json'
import { ChatMeta } from '../../chat/chat'

export abstract class FirebaseChatHandler {

    abstract leaveChat(chatId: string): Promise<void>
    abstract joinChat(chatId: string): Promise<void>
    abstract metaOn(path: Path): Observable<ChatMeta>
    abstract add(path: Path, data: IJson, newId?: string): Promise<string>

}
