import { Message } from '../message/message'

export class MicroMessage extends Message {

    static fromMessage(message: Message): MicroMessage {
        const microMessage = new MicroMessage()

        microMessage.id = message.id
        microMessage.type = message.type
        microMessage.from = message.from
        microMessage.date = message.date
        microMessage.body = message.body

        return microMessage
    }

}
