import { Message } from '../message/message'

export class FireStreamMessage extends Message {

    static fromMessage(message: Message): FireStreamMessage {
        const firestreamMessage = new FireStreamMessage()

        firestreamMessage.id = message.id
        firestreamMessage.type = message.type
        firestreamMessage.from = message.from
        firestreamMessage.date = message.date
        firestreamMessage.body = message.body

        return firestreamMessage
    }

}
