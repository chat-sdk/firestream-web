import 'mocha'
import 'firebase/auth'
import 'firebase/firestore'

import { initializeApp } from 'firebase/app'

import { F } from '../'
import { User } from '../lib/chat'
import { ConnectionEventType, EventType } from '../lib/events'
import { ContactType, RoleType } from '../lib/types'
import { firebaseConfig } from './firebase-config'

const app = initializeApp(firebaseConfig)
F.S.initialize(app)

const connect = async () => {
    await app.auth().signInWithEmailAndPassword('node@mail.com', 'pass1234')
    return new Promise(resolve => {
        F.S.getConnectionEvents().subscribe(event => {
            if (event.getType() === ConnectionEventType.DidConnect) {
                resolve()
            }
        })
    })
}

const testUserJohn = new User('13k1gXOyO0NG41HpQnO4yOplRQL2', RoleType.watcher())
const testUserAlex = new User('4qnJbkDFMbaKkmYcS7GTQvhsxHE3', RoleType.admin())
const testUserMike = new User('utSRkZHrNghKKRFlptTzziqqM7I3', RoleType.banned())
const testUsers = [testUserJohn, testUserAlex, testUserMike]

describe('perform tests', function() {
    this.timeout(10000)
    
    const connected = connect()

    it('add contact', async () => {
        await connected
        await F.S.addContact(testUserJohn, ContactType.contact())

        const contacts = F.S.getContacts()
        if (contacts.length !== 1) {
            throw new Error('contacts size must be 1')
        } else if (!contacts[0].equals(testUserJohn)) {
            throw new Error('correct user not added to contacts')
        }
    })

    it('get contact added', async () => {
        await connected
        return new Promise((resolve, reject) => {
            F.S.getContactEvents().allEvents().subscribe(event => {
                if (event.typeIs(EventType.Added)) {
                    if (event.user.equals(testUserJohn)) {
                        resolve()
                    } else {
                        reject(new Error('wrong user added'))
                    }
                } else {
                    reject(new Error('no contact added'))
                }
            })
        })
    })

    it('delete contact', async () => {
        await connected
        await F.S.removeContact(testUserJohn)

        const contacts = F.S.getContacts()
        if (contacts.length !== 0) {
            throw new Error('contacts size must be 0')
        }
    })

    it('get contact removed', async () => {
        await connected
        return new Promise((resolve, reject) => {
            F.S.getContactEvents().sinceLastEvent().subscribe(event => {
                if (event.typeIs(EventType.Removed)) {
                    if (event.user.equals(testUserJohn)) {
                        resolve()
                    } else {
                        reject(new Error('wrong user removed'))
                    }
                } else {
                    reject(new Error('no contact removed'))
                }
            })
        })
    })

    it('create chat', async () => {
        await connected
        const chatName = 'Test'
        const chatImageUrl = 'https://chatsdk.co/wp-content/uploads/2017/01/image_message-407x389.jpg'
        const customData = {
            TestKey:  'TestValue',
            Key2: 999,
        }

        const chat = await F.S.createChat(chatName, chatImageUrl, customData, testUsers)

        if (chat.getName() !== chatName) {
            throw new Error('Name mismatch')
        }

        if (chat.getImageURL() !== chatImageUrl) {
            throw new Error('Image url mismatch')
        }

        if (!chat.getId()) {
            throw new Error('Chat id not set')
        }

        if (chat.getCustomData()) {
            if (JSON.stringify(chat.getCustomData()) !== JSON.stringify(customData)) {
                throw new Error('Custom data value mismatch')
            }
        } else {
            throw new Error('Custom data is null')
        }

        for (const user of chat.getUsers()) {
            for (const testUser of testUsers) {
                if (user.equals(testUser) && !user.isMe()) {
                    if (!user.roleType!.equals(testUser.roleType!)) {
                        throw new Error('Role type mismatch')
                    }
                }
            }
            if (user.isMe() && !user.roleType!.equals(RoleType.owner())) {
                throw new Error('Creator user not owner')
            }
        }
    })

    it('modify chat', async () => {
        await connected
    })

    it('message chat', async () => {
        await connected
    })
})
