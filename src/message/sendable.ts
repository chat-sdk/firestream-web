import { Fireflyy } from '../fireflyy'
import { Keys } from '../firestore/keys'
import { BaseType } from '../types/base-type'
import { Message, TMessageBody } from '../firestore/message'

export class Sendable extends Message {

    id?: string

    constructor(id?: string, data?: TMessageBody) {
        super()

        if (!id || !data) {
            const uid = Fireflyy.shared().currentUserId()
            if (uid) {
                this.from = uid
            } else {
                console.error(new Error('Fireflyy.shared().currentUserId() returned undefined'))
            }
            return
        }

        this.id = id

        if (typeof data[Keys.From] === 'string') {
            this.from = data[Keys.From]
        }
        if (data[Keys.Date] instanceof Date) {
            this.date = data[Keys.Date]
        }
        if (typeof data[Keys.Body] === 'object') {
            this.body = data[Keys.Body]
        }
        if (typeof data[Keys.Type] === 'string') {
            this.type = data[Keys.Type]
        }
    }

    setBodyType(type: BaseType) {
        this.body[Keys.Type] = type.get()
    }

    getBodyType(): BaseType {
        if (typeof this.body[Keys.Type] === 'string') {
            const type: string = this.body[Keys.Type]
            return new BaseType(type)
        }
        return BaseType.none()
    }

    getBodyString(key: string): string {
        if (this.body[key] instanceof String) {
            return this.body[key]
        }
        throw new Error('Body doesn\'t contain key: ' + key)
    }

}
