import { IBaseMessage } from '../interfaces/base-message'
import { IJsonObject } from '../interfaces/json'
import { SendableType } from '../types/sendable-types'

export class BaseMessage implements IBaseMessage {

    protected from = ''
    protected date = new Date()
    protected body: IJsonObject = {}
    protected type = ''

    getFrom(): string {
        return this.from
    }

    setFrom(from: string) {
        this.from = from
    }

    getDate(): Date {
        return this.date
    }

    setDate(date: Date) {
        this.date = date
    }

    getBody(): IJsonObject {
        return this.body
    }

    setBody(body: IJsonObject) {
        this.body = body
    }

    getType(): string {
        return this.type
    }

    setType(type: string) {
        this.type = type
    }

    isType(type: SendableType) {
        return this.getType() === type.get()
    }

}
