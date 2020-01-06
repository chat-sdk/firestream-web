import { User } from '../chat/user'

export class FireStreamUser extends User {

    static fromUser(user: User): FireStreamUser {
        const firestreamUser = new FireStreamUser(user.id)
        firestreamUser.contactType = user.contactType
        firestreamUser.roleType = user.roleType
        return firestreamUser
    }

}
