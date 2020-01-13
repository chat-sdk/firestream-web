import { IJson } from './json'

export interface IBaseMessage {
    from: string
    date: Date
    body: IJson
    type: string
    getFrom(): string
    setFrom(from: string): void
    getDate(): Date
    setDate(date: Date): void
    getBody(): IJson
    setBody(body: IJson): void
    getType(): string
    setType(type: string): void
}
