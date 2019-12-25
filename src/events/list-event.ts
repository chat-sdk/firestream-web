import { Event } from './event'
import { EventType } from './event-type'

export type TEventData = { [key: string]: any }

export class ListEvent extends Event {

    id: string
    data: TEventData

    constructor(id: string, data: TEventData, type: EventType) {
        super(type)
        this.id = id
        this.data = data
    }

    get(key: string): any {
        if (this.data) {
            return this.data[key]
        }
    }

    static added(id: string, data: TEventData): ListEvent {
        return new ListEvent(id, data, EventType.Added)
    }

    static removed(id: string, data: TEventData): ListEvent {
        return new ListEvent(id, data, EventType.Removed)
    }

    static modified(id: string, data: TEventData): ListEvent {
        return new ListEvent(id, data, EventType.Modified)
    }

}
