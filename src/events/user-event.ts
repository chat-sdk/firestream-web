import { User } from '../chat/user'
import { Event } from './event'
import { EventType } from './event-type'
import { ListEvent } from './list-event'
import { Keys } from '../firebase/service/keys'
import { RoleType } from '../types/role-type'
import { ContactType } from '../types/contact-type'
import { FireflyUser } from '../namespace/firefly-user'

export class UserEvent extends Event {

    user: User

    constructor(user: User, type: EventType) {
        super(type)
        this.user = user
    }

    static added(user: User): UserEvent {
        return new UserEvent(user, EventType.Added)
    }

    static removed(user: User): UserEvent {
        return new UserEvent(user, EventType.Removed)
    }

    static modified(user: User): UserEvent {
        return new UserEvent(user, EventType.Modified)
    }

    static from(listEvent: ListEvent): UserEvent {
        if (typeof listEvent.get(Keys.Role) === 'string') {
            return new UserEvent(new User(listEvent.id, new RoleType(listEvent.get(Keys.Role))), listEvent.type)
        }
        if (typeof listEvent.get(Keys.Type) === 'string') {
            return new UserEvent(new User(listEvent.id, new ContactType(listEvent.get(Keys.Type))), listEvent.type)
        }
        return new UserEvent(new User(listEvent.id), listEvent.type)
    }

    getFireflyUser(): FireflyUser {
        return FireflyUser.fromUser(this.user)
    }

}
