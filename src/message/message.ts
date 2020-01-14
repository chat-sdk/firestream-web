import { IJsonObject } from '../interfaces/json'
import { ISendable } from '../interfaces/sendable'
import { SendableType } from '../types/sendable-types'
import { Sendable } from './sendable'

export class Message extends Sendable {

    constructor()
    constructor(body: IJsonObject)
    constructor(id: string, body: IJsonObject)
    constructor(arg1?: IJsonObject | string, arg2?: IJsonObject) {
        super()
        this.type = SendableType.Message
        if (typeof arg1 === 'string' && typeof arg2 === 'object') {
            this.id = arg1
            this.body = arg2
        } else if (typeof arg1 === 'object') {
            this.body = arg1
        }
    }

    static fromSendable(sendable: ISendable): Message {
        return sendable.copyTo(new Message())
    }

}
