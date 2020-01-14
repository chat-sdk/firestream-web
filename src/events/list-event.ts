import { IJsonObject } from '../interfaces/json'
import { Event } from './event'
import { EventType } from './event-type'

export class ListEvent extends Event {

    id: string
    data: IJsonObject

    constructor(id: string, data: IJsonObject, type: EventType) {
        super(type)
        this.id = id
        this.data = data
    }

    get(key: string): any {
        if (this.data) {
            return this.data[key]
        }
    }

    static added(id: string, data: IJsonObject): ListEvent {
        return new ListEvent(id, data, EventType.Added)
    }

    static removed(id: string, data: IJsonObject): ListEvent {
        return new ListEvent(id, data, EventType.Removed)
    }

    static modified(id: string, data: IJsonObject): ListEvent {
        return new ListEvent(id, data, EventType.Modified)
    }

}
