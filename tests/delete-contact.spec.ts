import { IFireStream } from '../src'
import { User } from '../src/chat'

export const deleteContactTest = (FS: IFireStream) => async (testUser: User) => {
    await FS.removeContact(testUser)

    const contacts = FS.getContacts()
    if (contacts.length !== 0) {
        throw new Error('contacts size must be 0')
    }
}
