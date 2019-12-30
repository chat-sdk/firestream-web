import { Event } from './event'
import { EventType } from './event-type'
import { IJson } from '../interfaces/json'

export class ListEvent extends Event {

    id: string
    data: IJson

    constructor(id: string, data: IJson, type: EventType) {
        super(type)
        this.id = id
        this.data = data
    }

    get(key: string): any {
        if (this.data) {
            return this.data[key]
        }
    }

    static added(id: string, data: IJson): ListEvent {
        return new ListEvent(id, data, EventType.Added)
    }

    static removed(id: string, data: IJson): ListEvent {
        return new ListEvent(id, data, EventType.Removed)
    }

    static modified(id: string, data: IJson): ListEvent {
        return new ListEvent(id, data, EventType.Modified)
    }

}
