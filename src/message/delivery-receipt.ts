import { Sendable } from './sendable'
import { SendableType } from '../types/sendable-types'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'

export class DeliveryReceipt extends Sendable {

    static MessageId = 'id'

    constructor(type?: DeliveryReceiptType, messageUid?: string) {
        super()
        this.type = SendableType.DeliveryReceipt
        if (type && messageUid) {
            this.setBodyType(type)
            this.body[DeliveryReceipt.MessageId] = messageUid
        }
    }

    getMessageId(): string {
        return this.getBodyString(DeliveryReceipt.MessageId)
    }

    getBodyType(): DeliveryReceiptType {
        return new DeliveryReceiptType(super.getBodyType())
    }

    static fromSendable(sendable: Sendable): DeliveryReceipt {
        return sendable.copyTo(new DeliveryReceipt())
    }

}
