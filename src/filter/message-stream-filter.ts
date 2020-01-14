import { FirebaseService } from '../firebase/service/firebase-service'
import { SendableType } from '../types/sendable-types'
import { ISendable } from '../interfaces/sendable'
import { SendableEvent } from '../events/sendable-event'

type Predicate<T> = (value: T) => boolean

export class MessageStreamFilter {

    static bySendableType(...types: SendableType[]): Predicate<ISendable> {
        return (sendable: ISendable) => {
            for (const type of types) {
                if (sendable.getType() === type.get()) {
                    return true
                }
            }
            return false
        }
    }

    static notFromMe<T extends ISendable>(): Predicate<T> {
        return (sendable: T) => sendable.getFrom() !== FirebaseService.userId
    }

    static eventBySendableType(...types: SendableType[]): Predicate<SendableEvent> {
        return (sendableEvent: SendableEvent) => {
            for (const type of types) {
                if (sendableEvent.getSendable().getType() === type.get()) {
                    return true
                }
            }
            return false
        }
    }

}
