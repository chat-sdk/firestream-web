import { Send } from '../chat/send'
import { FirebaseService } from '../firebase/service/firebase-service'
import { ISendable } from '../interfaces/sendable'
import { InvitationType } from '../types/invitation-type'
import { SendableType } from '../types/sendable-types'
import { Sendable } from './sendable'

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
            return FirebaseService.chat.joinChat(this.getChatId())
        }
    }

    static fromSendable(sendable: ISendable): Invitation {
        return sendable.copyTo(new Invitation())
    }

    static send(userId: string, type: InvitationType, groupId: string): Promise<void> {
        return Send.toUserId(userId, new Invitation(type, groupId))
    }

}
