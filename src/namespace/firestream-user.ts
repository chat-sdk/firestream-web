import { User } from '../chat/user'

export class FireStreamUser extends User {

    static fromUser(user: User): FireStreamUser {
        const firestreamUser = new FireStreamUser(user.getId())
        firestreamUser.setContactType(user.getContactType())
        firestreamUser.setRoleType(user.getRoleType())
        return firestreamUser
    }

}
