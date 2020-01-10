import { PresenceType } from '../types/presence-type'
import { SendableType } from '../types/sendable-types'
import { Sendable } from './sendable'

export class Presence extends Sendable {

    static PresenceKey = 'presence'

    constructor(type?: PresenceType) {
        super()
        this.type = SendableType.Presence
        if (type) {
            super.setBodyType(type)
        }
    }

    getBodyType(): PresenceType {
        return new PresenceType(super.getBodyType())
    }

    static fromSendable(sendable: Sendable): Presence {
        return sendable.copyTo(new Presence())
    }

}
