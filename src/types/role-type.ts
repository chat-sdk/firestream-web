import { BaseType } from './base-type'
import { Keys } from '../firebase/service/keys'

export class RoleType extends BaseType {

    /**
     * They have full access rights, can add and remove admins
     */
    static Owner = 'owner'

    /**
     * An admin can change the status of any lower member
     */
    static Admin = 'admin'

    /**
     * Standard member of the chat, has write access but can't change roles
     */
    static Member = 'member'

    /**
     * Read-only access
     */
    static Watcher = 'watcher'

    /**
     * Cannot access the chat, cannot be added
     */
    static Banned = 'banned'

    constructor(type: BaseType | string) {
        super(type)
    }

    static owner(): RoleType {
        return new RoleType(this.Owner)
    }

    static admin(): RoleType {
        return new RoleType(this.Admin)
    }

    static member(): RoleType {
        return new RoleType(this.Member)
    }

    static watcher(): RoleType {
        return new RoleType(this.Watcher)
    }

    static banned(): RoleType {
        return new RoleType(this.Banned)
    }

    data(): { [key: string]: string } {
        return { [Keys.Role]: this.get() }
    }

}
