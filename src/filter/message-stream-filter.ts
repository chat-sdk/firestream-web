import { FirebaseService } from '../firebase/service/firebase-service'
import { SendableType } from '../types/sendable-types'
import { ISendable } from '../interfaces/sendable'

export class MessageStreamFilter {

    static bySendableType(...types: SendableType[]) {
        return (sendable: ISendable) => {
            for (const type of types) {
                if (sendable.getType() === type.get()) {
                    return true
                }
            }
            return false
        }
    }

    static notFromMe() {
        return (sendable: ISendable) => sendable.from !== FirebaseService.userId
    }

}
