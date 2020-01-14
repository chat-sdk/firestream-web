import { Observable, Subject } from 'rxjs'

import { SendableEvent } from '../events/sendable-event'
import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { Invitation } from '../message/invitation'
import { Message } from '../message/message'
import { Presence } from '../message/presence'
import { TypingState } from '../message/typing-state'
import { FireStreamMessage } from '../namespace/firestream-message'

export class Events {

    protected messages = new MultiQueueSubject<Message>()
    protected deliveryReceipts = new MultiQueueSubject<DeliveryReceipt>()
    protected typingStates = new MultiQueueSubject<TypingState>()
    protected presences = new MultiQueueSubject<Presence>()
    protected invitations = new MultiQueueSubject<Invitation>()

    /**
     * The sendable event stream provides the most information. It passes a sendable event
     * when will include the kind of action that has been performed.
     */
    protected sendables = new MultiQueueSubject<SendableEvent>()

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
        return this.messages.map(FireStreamMessage.fromSendable)
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

    getSendables(): MultiQueueSubject<SendableEvent> {
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
