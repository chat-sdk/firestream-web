import { IAbstractChat } from './abstract-chat'
import { IChat } from './chat'

export interface IFireStream extends IAbstractChat {

    /**
     * Leave the chat. When you leave, you will be removed from the
     * chat's roster
     * @param chat to leave
     * @return completion
     */
    leaveChat(chat: IChat): Promise<void>

    /**
     * Join the chat. To join you must already be in the chat roster
     * @param chat to join
     * @return completion
     */
    joinChat(chat: IChat): Promise<void>

}
