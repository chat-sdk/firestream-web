import { Sendable } from './sendable'
import { SendableType } from '../types/sendable-types'
import { InvitationType } from '../types/invitation-type'

export class Invitation extends Sendable {

    static ChatId = 'id'

    constructor(type: InvitationType, chatId: string) {
        super()
        if (type && chatId) {
            super.setBodyType(type)
            this.body.put(Invitation.ChatId, chatId)
        } else {
            this.type = SendableType.Invitation
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
                throw new Error('Not implememted yet!')
                // return Fireflyy.shared().joinChat(getChatId())
            } catch (err) {
                throw err
            }
        }
        return Promise.resolve()
    }

}
