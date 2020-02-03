import { Config } from '../config'
import { Event, EventType } from '../events'
import { FireStreamStore } from '../firestream-store'
import { ISendable } from '../interfaces/sendable'
import { SendableType } from '../types/sendable-types'

export type Predicate<T> = (value: T) => boolean

export class Filter {

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

    static markReceived(config: Config): Predicate<Event<ISendable>> {
        return () => {
            return config.deliveryReceiptsEnabled && config.autoMarkReceived
        }
    }

    static combine(...predicates: Predicate<Event<ISendable>>[]): Predicate<Event<ISendable>> {
        return (event: Event<ISendable>) => {
            for (const p of predicates) {
                if (!p(event)) {
                    return false
                }
            }
            return true
        }
    }

}
