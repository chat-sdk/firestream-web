import { Event } from '../events'
import { ListData } from '../events/list-data'
import { Keys } from '../firebase/service/keys'
import { FireStreamStore } from '../firestream-store'
import { ContactType } from '../types/contact-type'
import { RoleType } from '../types/role-type'
import { expect } from '../utils/expect'

export interface DataProvider {
    data(user?: User): { [key: string]: any }
}

export class User {

    protected id: string
    protected roleType?: RoleType
    protected contactType?: ContactType

    constructor(id: string, roleType?: RoleType)
    constructor(id: string, contactType?: ContactType)
    constructor(id: string, arg2?: RoleType | ContactType) {
        this.id = id
        if (arg2 && arg2 instanceof RoleType) {
            this.roleType = arg2
        }
        if (arg2 && arg2 instanceof ContactType) {
            this.contactType = arg2
        }
    }

    getId(): string {
        return this.id
    }

    setId(id: string) {
        this.id = id
    }

    getRoleType(): RoleType | undefined {
        return this.roleType
    }

    setRoleType(roleType?: RoleType) {
        this.roleType = roleType
    }

    getContactType(): ContactType | undefined {
        return this.contactType
    }

    setContactType(contactType?: ContactType) {
        this.contactType = contactType
    }

    equalsRoleType(arg?: RoleType | User): boolean {
        if (arg instanceof RoleType) {
            return this.roleType?.equals(arg) || false
        }
        if (arg instanceof User) {
            return this.roleType?.equals(arg.getRoleType()) || false
        }
        return false
    }

    equalsContactType(arg?: ContactType | User): boolean {
        if (arg instanceof ContactType) {
            return this.contactType?.equals(arg) || false
        }
        if (arg instanceof User) {
            return this.contactType?.equals(arg.getContactType()) || false
        }
        return false
    }

    equals(user: User) {
        return user.id === this.id
    }

    isMe(): boolean {
        return this.id === FireStreamStore.userId
    }

    static currentUser(role?: RoleType): User | undefined {
        const uid = FireStreamStore.userId
        if (uid) {
            return new User(uid, role)
        }
    }

    static expectCurrentUser(role?: RoleType): User {
        return expect(this.currentUser(role), 'User.currentUser()')
    }

    static dateDataProvider(): DataProvider {
        return {
            data: user => ({
                [Keys.Date]: FireStreamStore.timestamp()
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

    static from(event: Event<ListData>): User {
        if (event.get().get(Keys.Role) instanceof String) {
            return new User(event.get().getId(), new RoleType(event.get().get(Keys.Role)))
        }
        if (event.get().get(Keys.Type) instanceof String) {
            return new User(event.get().getId(), new ContactType(event.get().get(Keys.Type)))
        }
        return new User(event.get().getId())
    }

}
