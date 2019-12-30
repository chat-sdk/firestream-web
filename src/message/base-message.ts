import { IJson } from '../interfaces/json'

export class BaseMessage {

    from = ''
    date = new Date()
    body: IJson = {}
    type = ''

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

    getBody(): IJson {
        return this.body
    }

    setBody(body: IJson) {
        this.body = body
    }

    getType(): string {
        return this.type
    }

    setType(type: string) {
        this.type = type
    }

}
