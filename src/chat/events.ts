import { Subject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { Sendable } from '../message/sendable'
import { Message } from '../message/message'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { TypingState } from '../message/typing-state'
import { Presence } from '../message/presence'
import { Invitation } from '../message/invitation'
import { FireStreamMessage } from '../namespace/firestream-message'

export class Events {

    protected messages = new MultiQueueSubject<Message>()
    protected deliveryReceipts = new MultiQueueSubject<DeliveryReceipt>()
    protected typingStates = new MultiQueueSubject<TypingState>()
    protected presences = new MultiQueueSubject<Presence>()
    protected invitations = new MultiQueueSubject<Invitation>()

    protected sendables = new MultiQueueSubject<Sendable>()

    protected errors = new Subject<Error>()

    getMessages(): MultiQueueSubject<Message> {
        return this.messages
    }

    /**
     * A FireStreamMessage is no different from a Message. The reason this method
     * exists is because Message is a very common class name. If for any reason
     * your project already has a Message object, you can use the FireStreamMessage
     * to avoid a naming clash
     * @return events of messages
     */
    getFireStreamMessages(): MultiQueueSubject<FireStreamMessage> {
        return this.messages.map(FireStreamMessage.fromMessage)
    }

    /**
     * Get a stream of errors from the chat
     * @return
     */
    getErrors(): Observable<Error> {
        return this.errors.asObservable()
    }

    getDeliveryReceipts(): MultiQueueSubject<DeliveryReceipt> {
        return this.deliveryReceipts
    }

    getTypingStates(): MultiQueueSubject<TypingState> {
        return this.typingStates
    }

    getSendables(): MultiQueueSubject<Sendable> {
        return this.sendables
    }

    getPresences(): MultiQueueSubject<Presence> {
        return this.presences
    }
    getInvitations(): MultiQueueSubject<Invitation> {
        return this.invitations
    }

    publishThrowable(): Subject<Error> {
        return this.errors
    }

}
