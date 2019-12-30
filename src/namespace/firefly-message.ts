import { Message } from '../message/message'

export class FireflyMessage extends Message {

    static fromMessage(message: Message): FireflyMessage {
        const fireflyMessage = new FireflyMessage()

        fireflyMessage.id = message.id
        fireflyMessage.type = message.type
        fireflyMessage.from = message.from
        fireflyMessage.date = message.date
        fireflyMessage.body = message.body

        return fireflyMessage
    }

}
