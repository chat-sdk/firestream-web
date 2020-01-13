import { ISendable } from '../interfaces/sendable'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'
import { SendableType } from '../types/sendable-types'
import { Sendable } from './sendable'

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

    static fromSendable(sendable: ISendable): DeliveryReceipt {
        return sendable.copyTo(new DeliveryReceipt())
    }

}
