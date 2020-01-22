import { Event, EventType } from '../events'
import { FireStreamStore } from '../firestream-store'
import { ISendable } from '../interfaces/sendable'
import { SendableType } from '../types/sendable-types'

type Predicate<T> = (value: T) => boolean

export class MessageStreamFilter {

    static bySendableType(...types: SendableType[]): Predicate<Event<ISendable>> {
        return (event: Event<ISendable>) => {
            for (const type of types) {
                if (event.get().getType() === type.get()) {
                    return true
                }
            }
            return false
        }
    }

    static notFromMe<T extends ISendable>(): Predicate<Event<T>> {
        return (event: Event<T>) => event.get().getFrom() !== FireStreamStore.userId
    }

    static byEventType(...types: EventType[]): Predicate<Event<ISendable>> {
        return (event: Event<ISendable>) => {
            for (const type of types) {
                if (event.getType() === type) {
                    return true
                }
            }
            return false
        }
    }

    static eventBySendableType(...types: SendableType[]): Predicate<Event<ISendable>> {
        return (event: Event<ISendable>) => {
            for (const type of types) {
                if (event.get().getType() === type.get()) {
                    return true
                }
            }
            return false
        }
    }

}
