import { Sendable } from './sendable'
import { SendableType } from '../types/sendable-types'
import { PresenceType } from '../types/presence-type'

export class Presence extends Sendable {

    static PresenceKey = 'presence'

    constructor(type?: PresenceType) {
        super()
        if (type) {
            super.setBodyType(type)
        } else {
            this.type = SendableType.Presence
        }
    }

    getBodyType(): PresenceType {
        return new PresenceType(super.getBodyType())
    }

}
