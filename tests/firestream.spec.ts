import 'mocha'
import 'firebase/auth'
import 'firebase/firestore'

import { initializeApp } from 'firebase/app'

import { FireStream } from '../src/firestream'
import { User } from '../src/chat/user'
import { ConnectionEventType } from '../src/events/connection-event'
import { EventType } from '../src/events/event-type'
import { ContactType } from '../src/types/contact-type'
import { firebaseConfig } from './firebase-config'

const app = initializeApp(firebaseConfig)
FireStream.shared.initialize(app)

const connect = async () => {
    await app.auth().signInWithEmailAndPassword('node@mail.com', 'pass1234')
    return new Promise(resolve => {
        FireStream.shared.getConnectionEvents().subscribe(event => {
            if (event.getType() === ConnectionEventType.DidConnect) {
                resolve()
            }
        })
    })
}

const getTestUser = () => {
    return new User('t2MwmuyrDGXV2gQyOo54P0Djdsn2')
}

describe('perform tests', function() {
    this.timeout(10000)
    const testUser = getTestUser()
    const connected = connect()

    it('add contact', async () => {
        await connected
        await FireStream.shared.addContact(testUser, ContactType.contact())

        const contacts = FireStream.shared.getContacts()
        if (contacts.length !== 1) {
            throw new Error('contacts size must be 1')
        } else if (!contacts[0].equals(testUser)) {
            throw new Error('correct user not added to contacts')
        }
    })

    it('get contact added', async () => {
        await connected
        return new Promise((resolve, reject) => {
            FireStream.shared.getContactEvents().allEvents().subscribe(event => {
                if (event.type === EventType.Added) {
                    if (event.user.equals(testUser)) {
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
        await FireStream.shared.removeContact(testUser)

        const contacts = FireStream.shared.getContacts()
        if (contacts.length !== 0) {
            throw new Error('contacts size must be 0')
        }
    })

    it('get contact removed', async () => {
        await connected
        return new Promise((resolve, reject) => {
            FireStream.shared.getContactEvents().allEvents().subscribe(event => {
                console.log('CONTACT EVENT:', event.type)
                if (event.type === EventType.Removed) {
                    console.log('SUCCESS')
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
    })

    it('create chat', async () => {
        await connected
    })

    it('modify chat', async () => {
        await connected
    })

    it('message chat', async () => {
        await connected
    })
})
