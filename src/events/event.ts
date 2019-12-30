import { EventType } from './event-type'

export class Event {

    type: EventType

    constructor(type: EventType) {
        this.type = type
    }

}
