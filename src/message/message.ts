import { Sendable } from './sendable'
import { TMessageBody } from '../firestore/message'
import { SendableType } from '../types/sendable-types'

export class Message extends Sendable {

    constructor(body?: TMessageBody) {
        super()
        this.type = SendableType.Message
        if (body) {
            this.body = body
        }
    }

}
