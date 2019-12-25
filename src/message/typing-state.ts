import { Sendable } from './sendable'
import { SendableType } from '../types/sendable-types'
import { TypingStateType } from '../types/typing-state-type'

export class TypingState extends Sendable {

    constructor(type?: TypingStateType) {
        super()
        if (type) {
            this.setBodyType(type)
        } else {
            this.type = SendableType.TypingState
        }
    }

    public getBodyType(): TypingStateType {
        return new TypingStateType(super.getBodyType())
    }

}
