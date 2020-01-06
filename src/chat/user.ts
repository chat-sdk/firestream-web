import { RoleType } from '../types/role-type'
import { ContactType } from '../types/contact-type'
import { FireStream } from '../firestream'
import { Keys } from '../firebase/service/keys'

export interface DataProvider {
    data(user?: User): { [key: string]: any }
}

export class User {

    id: string
    roleType?: RoleType
    contactType?: ContactType

    constructor(id: string, roleType?: RoleType)
    constructor(id: string, roleType?: ContactType)
    constructor(id: string, arg2?: RoleType | ContactType) {
        this.id = id
        if (arg2 && arg2 instanceof RoleType) {
            this.roleType = arg2
        }
        if (arg2 && arg2 instanceof ContactType) {
            this.contactType = arg2
        }
    }

    equals(user: any) {
        if (user instanceof User) {
            return user.id === this.id
        }
        return false
    }

    isMe(): boolean {
        return this.id === FireStream.shared().currentUserId()
    }

    static currentUser(role?: RoleType): User {
        const uid = FireStream.shared().currentUserId()
        if (uid) {
            return new User(uid, role)
        }
        throw new Error('FireStream.shared().currentUserId() returned undefined')
    }

    static dateDataProvider(): DataProvider {
        return {
            data: user => ({
                [Keys.Date]: FireStream.shared().getFirebaseService().core.timestamp()
            })
        }
    }

    static roleTypeDataProvider(): DataProvider {
        return {
            data: user => user?.roleType?.data() || {}
        }
    }

    static contactTypeDataProvider(): DataProvider {
        return {
            data: user => user?.contactType?.data() || {}
        }
    }

}
