import { FirebaseService } from '../firebase/service/firebase-service'
import { Keys } from '../firebase/service/keys'
import { ContactType } from '../types/contact-type'
import { RoleType } from '../types/role-type'

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
        return this.id === FirebaseService.userId
    }

    static currentUser(role?: RoleType): User {
        return new User(FirebaseService.userId, role)
    }

    static dateDataProvider(): DataProvider {
        return {
            data: user => ({
                [Keys.Date]: FirebaseService.core.timestamp()
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
