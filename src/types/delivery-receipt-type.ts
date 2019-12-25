import { BaseType } from './base-type'

export class DeliveryReceiptType extends BaseType {

    static Received = 'received'
    static Read = 'read'

    constructor(type: BaseType | string) {
        super(type)
    }

    static received(): DeliveryReceiptType {
        return new DeliveryReceiptType(this.Received)
    }

    static read(): DeliveryReceiptType {
        return new DeliveryReceiptType(this.Read)
    }

}
