import { BaseMessage } from '../message/base-message'
import { BaseType } from '../types/base-type'
import { IBaseMessage } from './base-message'
import { Equals } from './equals'
import { IJsonObject } from './json'

export interface ISendable extends IBaseMessage, Equals<ISendable> {
    setBodyType(type: BaseType): void
    getBodyType(): BaseType
    getBodyString(key: string): string
    copyTo<T extends ISendable>(sendable: T): T
    toData(): IJsonObject
    toBaseMessage(): BaseMessage
    setId(id: string): void
    getId(): string
    equals(message: ISendable): boolean
}
