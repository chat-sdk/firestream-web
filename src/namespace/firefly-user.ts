import { User } from '../chat/user'
import { RoleType } from '../types/role-type'

export class FireflyUser extends User {

    constructor(id: string, roleType?: RoleType) {
        super(id, roleType)
    }

    static fromUser(user: User): FireflyUser {
        const mu = new FireflyUser(user.id)
        mu.contactType = user.contactType
        mu.roleType = user.roleType
        return mu
    }

}
