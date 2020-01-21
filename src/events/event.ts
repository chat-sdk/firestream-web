import { EventType } from './event-type'

export class Event<T> {

    protected payload: T
    protected type: EventType

    constructor(payload: T, type: EventType) {
        this.payload = payload
        this.type = type
    }

    getType(): EventType {
        return this.type
    }

    typeIs(type: EventType): boolean {
        return this.type === type
    }

    get(): T {
        return this.payload
    }

    static added<T>(payload: T): Event<T> {
        return new Event(payload, EventType.Added);
    }

    static removed<T>(payload: T): Event<T> {
        return new Event(payload, EventType.Removed);
    }

    static modified<T>(payload: T): Event<T> {
        return new Event(payload, EventType.Modified);
    }

    to<W>(payload: W): Event<W> {
        return new Event<W>(payload, this.type)
    }

}
