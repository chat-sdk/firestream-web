import { Chat } from '../chat/chat'
import { Keys } from '../firebase/service/keys'
import { IChat } from '../interfaces/chat'
import { Event } from './event'
import { EventType } from './event-type'
import { ListEvent } from './list-event'

export class ChatEvent extends Event {

    protected chat: Chat

    constructor(chat: Chat, type: EventType) {
        super(type)
        this.chat = chat
    }

    static added(chat: Chat): ChatEvent {
        return new ChatEvent(chat, EventType.Added)
    }

    static removed(chat: Chat): ChatEvent {
        return new ChatEvent(chat, EventType.Removed)
    }

    static modified(chat: Chat): ChatEvent {
        return new ChatEvent(chat, EventType.Modified)
    }

    static from(listEvent: ListEvent): ChatEvent {
        if (listEvent.get(Keys.Date) instanceof Date) {
            return new ChatEvent(new Chat(listEvent.id, listEvent.get(Keys.Date)), listEvent.getType())
        }
        return new ChatEvent(new Chat(listEvent.id), listEvent.getType())
    }

    getChat(): IChat {
        return this.chat
    }

}
