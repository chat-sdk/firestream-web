import { Sendable } from './sendable'
import { SendableType } from '../types/sendable-types'
import { InvitationType } from '../types/invitation-type'
import { FireStream } from '../firestream'

export class Invitation extends Sendable {

    static ChatId = 'id'

    constructor(type?: InvitationType, chatId?: string) {
        super()
        this.type = SendableType.Invitation
        if (type && chatId) {
            this.setBodyType(type)
            this.body[Invitation.ChatId] = chatId
        }
    }

    getBodyType(): InvitationType {
        return new InvitationType(super.getBodyType())
    }

    getChatId(): string {
        return this.getBodyString(Invitation.ChatId)
    }

    async accept(): Promise<void> {
        if (this.getBodyType().equals(InvitationType.chat())) {
            try {
                return FireStream.shared().joinChat(this.getChatId())
            } catch (err) {
                throw err
            }
        }
        return Promise.resolve()
    }

    static fromSendable(sendable: Sendable): Invitation {
        return sendable.copyTo(new Invitation())
    }

}
