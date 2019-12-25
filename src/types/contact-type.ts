import { BaseType } from './base-type'
import { Keys } from '../firestore/keys'

export class ContactType extends BaseType {

    /**
     * They have full access rights, can add and remove admins
     */
    static Contact = 'contact'

    constructor(type: BaseType | string) {
        super(type)
    }

    static contact(): ContactType {
        return new ContactType(this.Contact)
    }

    data(): { [key: string]: string } {
        return { [Keys.Type]: this.get() }
    }

}
