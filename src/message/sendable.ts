import { FirebaseService } from '../firebase/service/firebase-service'
import { Keys } from '../firebase/service/keys'
import { IJson } from '../interfaces/json'
import { ISendable } from '../interfaces/sendable'
import { BaseType } from '../types/base-type'
import { BaseMessage } from './base-message'

export class Sendable extends BaseMessage implements ISendable {

    id!: string

    constructor(id?: string, data?: IJson) {
        super()

        if (!id || !data) {
            try {
                this.from = FirebaseService.userId
            } catch (err) {
                console.error(err)
            }
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
            this.body = data[Keys.Body] as IJson
        }
        if (typeof data[Keys.Type] === 'string') {
            this.type = data[Keys.Type] as string
        }
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
        sendable.id = this.id
        sendable.from = this.from
        sendable.body = this.body
        sendable.date = this.date
        return sendable
    }

    toData(): IJson {
        const data = {
            [Keys.From]: this.from,
            [Keys.Body]: this.body,
            [Keys.Date]: FirebaseService.core.timestamp(),
            [Keys.Type]: this.type,
        }
        return data
    }

}
