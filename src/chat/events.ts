import { Subject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { MultiQueueSubject } from '../rx/multi-queue-subject'
import { Sendable } from '../message/sendable'
import { Message } from '../message/message'
import { DeliveryReceipt } from '../message/delivery-receipt'
import { TypingState } from '../message/typing-state'
import { Presence } from '../message/presence'
import { Invitation } from '../message/invitation'
import { MicroMessage } from '../namespace/micro-message'

export class Events {

    protected messages = new MultiQueueSubject<Message>()
    protected deliveryReceipts = new MultiQueueSubject<DeliveryReceipt>()
    protected typingStates = new MultiQueueSubject<TypingState>()
    protected presences = new MultiQueueSubject<Presence>()
    protected invitations = new MultiQueueSubject<Invitation>()

    protected sendables = new MultiQueueSubject<Sendable>()

    protected errors = Subject.create()

    getErrors(): Observable<any> {
        return this.errors
    }

    getMessages(): MultiQueueSubject<Message> {
        return this.messages
    }

    /**
     * A Micro Message is no different from a Message. The reason this method
     * exists is because Message is a very common class name. If for any reason
     * your project already has a Message object, you can use the MicroMessage
     * to avoid a naming clash
     * @return events of messages
     */
    public getMicroMessages(): Observable<MicroMessage> {
        return this.messages.pipe(map(MicroMessage.fromMessage))
    }

    public getDeliveryReceipts(): MultiQueueSubject<DeliveryReceipt> {
        return this.deliveryReceipts
    }

    public getTypingStates(): MultiQueueSubject<TypingState> {
        return this.typingStates
    }

    public getSendables(): MultiQueueSubject<Sendable> {
        return this.sendables
    }


    public getPresences(): MultiQueueSubject<Presence> {
        return this.presences
    }
    public getInvitations(): MultiQueueSubject<Invitation> {
        return this.invitations
    }

    public impl_throwablePublishSubject(): Subject<any> {
        return this.errors
    }

}
