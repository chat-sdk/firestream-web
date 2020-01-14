import { ISendable } from '../interfaces/sendable'
import { SendableType } from '../types/sendable-types'
import { TypingStateType } from '../types/typing-state-type'
import { Sendable } from './sendable'

export class TypingState extends Sendable {

    constructor(type?: TypingStateType) {
        super()
        this.type = SendableType.TypingState
        if (type) {
            this.setBodyType(type)
        }
    }

    public getTypingStateType(): TypingStateType {
        return new TypingStateType(super.getBodyType())
    }

    static fromSendable(sendable: ISendable): TypingState {
        return sendable.copyTo(new TypingState())
    }

}
