import 'mocha'
import 'firebase/auth'
import 'firebase/firestore'

import { initializeApp } from 'firebase/app'

import { Fire } from '../'
import { User } from '../lib/chat/user'
import { ConnectionEventType } from '../lib/events/connection-event'
import { EventType } from '../lib/events/event-type'
import { ContactType } from '../lib/types/contact-type'
import { firebaseConfig } from './firebase-config'

const app = initializeApp(firebaseConfig)
Fire.Stream.initialize(app)

const connect = async () => {
    await app.auth().signInWithEmailAndPassword('node@mail.com', 'pass1234')
    return new Promise(resolve => {
        Fire.Stream.getConnectionEvents().subscribe(event => {
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
        await Fire.Stream.addContact(testUser, ContactType.contact())

        const contacts = Fire.Stream.getContacts()
        if (contacts.length !== 1) {
            throw new Error('contacts size must be 1')
        } else if (!contacts[0].equals(testUser)) {
            throw new Error('correct user not added to contacts')
        }
    })

    it('get contact added', async () => {
        await connected
        return new Promise((resolve, reject) => {
            Fire.Stream.getContactEvents().allEvents().subscribe(event => {
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
        await Fire.Stream.removeContact(testUser)

        const contacts = Fire.Stream.getContacts()
        if (contacts.length !== 0) {
            throw new Error('contacts size must be 0')
        }
    })
})
