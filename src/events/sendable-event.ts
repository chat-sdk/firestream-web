import { ISendable } from '../interfaces/sendable'
import { Event } from './event'
import { EventType } from './event-type'

export class SendableEvent extends Event {

    protected sendable: ISendable

    constructor(sendable: ISendable, type: EventType) {
        super(type)
        this.sendable = sendable
    }

    static added(sendable: ISendable): SendableEvent {
        return new SendableEvent(sendable, EventType.Added)
    }

    static removed(sendable: ISendable): SendableEvent {
        return new SendableEvent(sendable, EventType.Removed)
    }

    static modified(sendable: ISendable): SendableEvent {
        return new SendableEvent(sendable, EventType.Modified)
    }

    getSendable(): ISendable {
        return this.sendable
    }

}
