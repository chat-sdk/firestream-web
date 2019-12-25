import { BaseType } from './base-type'

export class InvitationType extends BaseType {

    static Chat = 'chat'

    constructor(type: BaseType | string) {
        super(type)
    }

    static chat(): InvitationType {
        return new InvitationType(this.Chat)
    }

}
