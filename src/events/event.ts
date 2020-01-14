import { EventType } from './event-type'

export class Event {

     protected type: EventType

    constructor(type: EventType) {
        this.type = type
    }

    getType(): EventType {
        return this.type
    }

    typeIs(type: EventType): boolean {
        return this.type === type
    }

}
