import { EventType, IFireStream } from '../lib'
import { User } from '../lib/chat'

export const getContactRemovedTest = (FS: IFireStream) => async (testUser: User) => {
    return new Promise((resolve, reject) => {
        FS.getContactEvents().sinceLastEvent().subscribe(event => {
            if (event.typeIs(EventType.Removed)) {
                if (event.user.equals(testUser)) {
                    resolve()
                } else {
                    reject(new Error('wrong user removed'))
                }
            } else {
                reject(new Error('no contact removed'))
            }
        })
    })
}
