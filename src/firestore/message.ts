export type TMessageBody = { [key: string]: any }

export class Message {

    from = ''
    date = new Date()
    body: TMessageBody = {}
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

    getBody(): TMessageBody {
        return this.body
    }

    setBody(body: TMessageBody) {
        this.body = body
    }

    getType(): string {
        return this.type
    }

    setType(type: string) {
        this.type = type
    }

}
