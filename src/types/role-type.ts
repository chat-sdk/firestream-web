import { BaseType } from './base-type'
import { Keys } from '../firebase/service/keys'
import { IJson } from '../interfaces/json'
import { User } from '../chat/user'

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

    static none(): RoleType {
        return new RoleType('')
    }

    data(): IJson {
        return { [Keys.Role]: this.get() }
    }

    test(user: User): boolean {
        const roleType = user.roleType
        return roleType !== undefined && roleType.toLevel() <= this.toLevel()
    }

    protected toLevel(): number {
        if (this.type === RoleType.Owner) {
            return 0;
        }
        if (this.type === RoleType.Admin) {
            return 1;
        }
        if (this.type === RoleType.Member) {
            return 2;
        }
        if (this.type === RoleType.Watcher) {
            return 3;
        }
        if (this.type === RoleType.Banned) {
            return 4;
        }
        return 5;
    }

}
