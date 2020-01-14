import { SendableType } from '../types/sendable-types'
import { IJsonObject } from './json'

export interface IBaseMessage {
    getFrom(): string
    setFrom(from: string): void
    getDate(): Date
    setDate(date: Date): void
    getBody(): IJsonObject
    setBody(body: IJsonObject): void
    getType(): string
    setType(type: string): void
    isType(type: SendableType): boolean
}
