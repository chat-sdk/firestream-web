import { Send } from '../chat/send'
import { ISendable } from '../interfaces/sendable'
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

    static fromSendable(sendable: ISendable): Presence {
        return sendable.copyTo(new Presence())
    }

    static send(userId: string, type: PresenceType): Promise<void> {
        return Send.toUserId(userId, new Presence(type))
    }

}
