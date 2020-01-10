import { Subscription } from 'rxjs'

import { Events } from '../chat/events'
import { SubscriptionMap } from '../firebase/rx/subscription-map'
import { Sendable } from '../message/sendable'
import { SendableType } from '../types/sendable-types'

export interface IAbstractChat {

    /**
     * Connect to the chat
     * @throws Exception error if we are not connected
     */
    connect(): void

    /**
     * Disconnect from a chat. This does not affect our membership but we will
     * no longer receive any updates unless we log out / log in again
     */
    disconnect(): void

    /**
     * When we leave / disconnect from a chat or when we log out, any subscriptions
     * will be unsubscribed of automatically
     * @param subscription to manage
     */
    manage(subscription: Subscription): void

    /**
     * Get the managed subscription map. This map will be unsubscribed of when we leave / disconnect
     * from the chat or when we log out. Use this to store any subscriptions that you want to be
     * unsubscribed of then. This is slightly more flexible than the manage method because it allows
     * you to store and retrieve subscriptions with an ID.
     * @return a pointer to the managed subscription map
     */
    getSubscriptionMap(): SubscriptionMap

    /**
     * Get a list of all sendables received
     * @return a list of sendables
     */
    getSendables(): Sendable[]

    /**
     * Get a list of sendables filtered by type
     * @param type of sendable
     * @return a filtered list of sendables
     */
    getSendables(type: SendableType): Sendable[]

    /**
     * Get access to the events object which provides access to observables for sendable events
     * @return events holder
     */
    getSendableEvents(): Events

}
