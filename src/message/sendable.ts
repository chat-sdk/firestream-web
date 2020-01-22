import { Keys } from '../firebase/service/keys'
import { FireStreamStore } from '../firestream-store'
import { IJsonObject } from '../interfaces/json'
import { ISendable } from '../interfaces/sendable'
import { BaseType } from '../types/base-type'
import { BaseMessage } from './base-message'

export class Sendable extends BaseMessage implements ISendable {

    protected id!: string

    constructor(id?: string, data?: IJsonObject) {
        super()

        if (!id || !data) {
            this.from = FireStreamStore.expectUserId()
            return
        }

        this.id = id

        if (typeof data[Keys.From] === 'string') {
            this.from = data[Keys.From] as string
        }
        if (data[Keys.Date] instanceof Date) {
            this.date = data[Keys.Date] as Date
        }
        if (typeof data[Keys.Body] === 'object') {
            this.body = data[Keys.Body] as IJsonObject
        }
        if (typeof data[Keys.Type] === 'string') {
            this.type = data[Keys.Type] as string
        }
    }

    valid(): boolean {
        return this.from != null && this.date != null && this.body != null && this.type != null
    }

    setBodyType(type: BaseType) {
        this.body[Keys.Type] = type.get()
    }

    getBodyType(): BaseType {
        if (typeof this.body[Keys.Type] === 'string') {
            const type = this.body[Keys.Type] as string
            return new BaseType(type)
        }
        return BaseType.none()
    }

    getBodyString(key: string): string {
        const value = this.body[key]
        if (typeof value === 'string') {
            return value
        }
        throw new Error('Body doesn\'t contain key: ' + key)
    }

    copyTo<T extends ISendable>(sendable: T): T {
        sendable.setId(this.id)
        sendable.setFrom(this.from)
        sendable.setBody(this.body)
        sendable.setDate(this.date)
        return sendable
    }

    toBaseMessage(): BaseMessage {
        const message = new BaseMessage()
        message.setFrom(this.from)
        message.setBody(this.body)
        message.setDate(this.date)
        message.setType(this.type)
        return message
    }

    toData(): IJsonObject {
        const data = {
            [Keys.From]: this.from,
            [Keys.Body]: this.body,
            [Keys.Date]: FireStreamStore.timestamp(),
            [Keys.Type]: this.type,
        }
        return data
    }

    setId(id: string) {
        this.id = id
    }

    getId(): string {
        return this.id
    }

    equals(message: ISendable): boolean {
        return this.getId() === message.getId()
    }

}
