import { Observable } from 'rxjs'

import { Path } from './path'
import { IJson } from '../../interfaces/json'

export abstract class FirebaseChatHandler {

    abstract leaveChat(chatId: string): Promise<void>
    abstract joinChat(chatId: string): Promise<void>
    abstract metaOn(path: Path): Observable<IJson>
    abstract add(path: Path, data: IJson): Promise<string>

}
