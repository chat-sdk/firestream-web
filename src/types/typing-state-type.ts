import { BaseType } from './base-type'

export class TypingStateType extends BaseType {

    static Typing = 'typing'

    constructor(type: BaseType | string) {
        super(type)
    }

    static typing(): TypingStateType {
        return new TypingStateType(this.Typing)
    }

    static none(): TypingStateType {
        return new TypingStateType('')
    }

}
