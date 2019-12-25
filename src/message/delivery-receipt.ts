import { Sendable } from './sendable'
import { SendableType } from '../types/sendable-types'
import { DeliveryReceiptType } from '../types/delivery-receipt-type'

export class DeliveryReceipt extends Sendable {

    static MessageId = 'id'

    constructor(type?: DeliveryReceiptType, messageUid?: String) {
        super()
        if (type && messageUid) {
            this.setBodyType(type)
            this.body.put(DeliveryReceipt.MessageId, messageUid)
        } else {
            this.type = SendableType.DeliveryReceipt
        }
    }

    getMessageId(): string {
        return this.getBodyString(DeliveryReceipt.MessageId)
    }

    getBodyType(): DeliveryReceiptType {
        return new DeliveryReceiptType(super.getBodyType())
    }

}
