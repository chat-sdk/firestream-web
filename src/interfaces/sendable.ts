import { BaseType } from '../types/base-type'
import { IBaseMessage } from './base-message'
import { IJson } from './json'

export interface ISendable extends IBaseMessage {
    id: string
    from: string
    body: IJson
    date: Date
    type: string
    setBodyType(type: BaseType): void
    getBodyType(): BaseType
    getBodyString(key: string): string
    copyTo<T extends ISendable>(sendable: T): T
    toData(): IJson
}
