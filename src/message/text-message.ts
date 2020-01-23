import { ISendable } from '../interfaces'
import { Message } from './message'

export class TextMessage extends Message {

    static TextKey = 'text'

    constructor(text?: string) {
        super()
        if (text) {
            this.body[TextMessage.TextKey] = text
        }
    }

    getText(): string {
        return this.body[TextMessage.TextKey]?.toString() || ''
    }

    static fromSendable(sendable: ISendable): TextMessage {
        const message = new TextMessage()
        sendable.copyTo(message)
        return message
    }

}
