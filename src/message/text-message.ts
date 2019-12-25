import { Message } from './message'

export class TextMessage extends Message {

    static TextKey = 'text'

    constructor(text?: string) {
        super()
        if (text) {
            this.body[TextMessage.TextKey] = text
        }
    }

}