import 'mocha'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/firestore'

import { initializeApp } from 'firebase/app'

import { User } from '../src/chat'
import { ConnectionEventType } from '../src/events'
import { SubscriptionMap } from '../src/firebase/rx/subscription-map'
import { F } from '../src/index'
import { RoleType } from '../src/types'
import { addContactTest } from './add-contact.spec'
import { createChatTest } from './create-chat.spec'
import { deleteContactTest } from './delete-contact.spec'
import { firebaseConfig } from './firebase-config'
import { getContactAddedTest } from './get-contact-added.spec'
import { getContactRemovedTest } from './get-contact-removed.spec'
import { messageChatTest } from './message-chat.spec'
import { modifyChatTest } from './modify-chat.spec'

const sm = new SubscriptionMap()

const app = initializeApp(firebaseConfig)
F.S.initialize(app)

const connect = async () => {
    await app.auth().signInWithEmailAndPassword('node@mail.com', 'pass1234')
    return new Promise(resolve => {
        F.S.getConnectionEvents().subscribe(event => {
            if (event.getType() === ConnectionEventType.DidConnect) {
                resolve()
            }
            if (event.getType() === ConnectionEventType.WillDisconnect) {
                sm.unsubscribe()
            }
            if (event.getType() === ConnectionEventType.DidDisconnect) {
                sm.unsubscribe()
            }
        })
    })
}

const testUserJohn = new User('13k1gXOyO0NG41HpQnO4yOplRQL2', RoleType.watcher())
const testUserAlex = new User('4qnJbkDFMbaKkmYcS7GTQvhsxHE3', RoleType.admin())
const testUserMike = new User('utSRkZHrNghKKRFlptTzziqqM7I3', RoleType.banned())
const testUsers = [testUserJohn, testUserAlex, testUserMike]

describe('perform tests', function() {
    this.timeout(20000)

    const connected = connect()

    it('add contact', async () => {
        await connected
        return addContactTest(F.S)(testUserJohn)
    })

    it('get contact added', async () => {
        await connected
        return getContactAddedTest(F.S)(testUserJohn)
    })

    it('delete contact', async () => {
        await connected
        return deleteContactTest(F.S)(testUserJohn)
    })

    it('get contact removed', async () => {
        await connected
        return getContactRemovedTest(F.S)(testUserJohn)
    })

    it('create chat', async () => {
        await connected
        return createChatTest(F.S)(testUsers)
    })

    it('modify chat', async () => {
        await connected
        return modifyChatTest(F.S, sm)(testUsers)
    })

    it('message chat', async () => {
        await connected
        return messageChatTest(F.S, sm)()
    })
})
