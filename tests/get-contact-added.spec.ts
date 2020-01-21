import { IFireStream, EventType } from '../lib'
import { User } from '../lib/chat'

export const getContactAddedTest = (FS: IFireStream) => async (testUser: User) => {
    return new Promise((resolve, reject) => {
        FS.getContactEvents().allEvents().subscribe(event => {
            if (event.typeIs(EventType.Added)) {
                if (event.get().equals(testUser)) {
                    resolve()
                } else {
                    reject(new Error('wrong user added'))
                }
            } else {
                reject(new Error('no contact added'))
            }
        })
    })
}
