import { IFireStream } from '../lib'
import { User } from '../lib/chat'

export const deleteContactTest = (FS: IFireStream) => async (testUser: User) => {
    await FS.removeContact(testUser)

    const contacts = FS.getContacts()
    if (contacts.length !== 0) {
        throw new Error('contacts size must be 0')
    }
}
