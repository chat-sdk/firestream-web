import { BaseType } from './base-type'

export class SendableType extends BaseType {

    static Message = 'message'
    static DeliveryReceipt = 'receipt'
    static TypingState = 'typing'
    static Presence = 'presence'
    static Invitation = 'invitation'

    constructor(type: BaseType | string) {
        super(type)
    }

    static message(): SendableType {
        return new SendableType(this.Message)
    }

    static deliveryReceipt(): SendableType {
        return new SendableType(this.DeliveryReceipt)
    }

    static typingState(): SendableType {
        return new SendableType(this.TypingState)
    }

    static presence(): SendableType {
        return new SendableType(this.Presence)
    }

    static invitation(): SendableType {
        return new SendableType(this.Invitation)
    }

}
