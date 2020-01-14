import { ISendable } from '../interfaces/sendable'
import { Message } from '../message/message'

export class FireStreamMessage extends Message {

    static fromSendable(sendable: ISendable): FireStreamMessage {
        const message = new FireStreamMessage()
        sendable.copyTo(message)
        return message
    }

}
