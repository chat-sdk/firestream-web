import { Observable, Subject } from 'rxjs'

import { Event } from '../events'
import { MultiQueueSubject } from '../firebase/rx/multi-queue-subject'
import { ISendable } from '../interfaces'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { Invitation } from '../message/invitation'
import { Message } from '../message/message'
import { Presence } from '../message/presence'
import { TypingState } from '../message/typing-state'
import { FireStreamMessage } from '../namespace/firestream-message'

export class Events {

    protected messages = new MultiQueueSubject<Event<Message>>()
    protected deliveryReceipts = new MultiQueueSubject<Event<DeliveryReceipt>>()
    protected typingStates = new MultiQueueSubject<Event<TypingState>>()
    protected presences = new MultiQueueSubject<Event<Presence>>()
    protected invitations = new MultiQueueSubject<Event<Invitation>>()

    /**
     * The sendable event stream provides the most information. It passes a sendable event
     * when will include the kind of action that has been performed.
     */
    protected sendables = new MultiQueueSubject<Event<ISendable>>()

    protected errors = new Subject<Error>()

    getMessages(): MultiQueueSubject<Event<Message>> {
        return this.messages
    }

    /**
     * A FireStreamMessage is no different from a Message. The reason this method
     * exists is because Message is a very common class name. If for any reason
     * your project already has a Message object, you can use the FireStreamMessage
     * to avoid a naming clash
     * @return events of messages
     */
    getFireStreamMessages(): MultiQueueSubject<Event<FireStreamMessage>> {
        return this.messages.map(messageEvent => messageEvent.to(FireStreamMessage.fromSendable(messageEvent.get())))
    }

    /**
     * Get a stream of errors from the chat
     * @return
     */
    getErrors(): Observable<Error> {
        return this.errors.asObservable()
    }

    getDeliveryReceipts(): MultiQueueSubject<Event<DeliveryReceipt>> {
        return this.deliveryReceipts
    }

    getTypingStates(): MultiQueueSubject<Event<TypingState>> {
        return this.typingStates
    }

    getSendables(): MultiQueueSubject<Event<ISendable>> {
        return this.sendables
    }

    getPresences(): MultiQueueSubject<Event<Presence>> {
        return this.presences
    }
    getInvitations(): MultiQueueSubject<Event<Invitation>> {
        return this.invitations
    }

    publishThrowable(): Subject<Error> {
        return this.errors
    }

}
