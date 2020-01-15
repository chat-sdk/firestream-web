import { Subscription } from 'rxjs'

export class SubscriptionMap {

    protected static DefaultKey = 'def'

    protected map = new Map<any, SubscriptionMap.SubscriptionList>()

    put(key: any, subscription: Subscription) {
        this.get(key).add(subscription)
    }

    unsubscribe(key?: any) {
        if (key) {
            this.get(key).unsubscribe()
        } else {
            this.get(SubscriptionMap.DefaultKey).unsubscribe()
        }
    }

    get(key: any): SubscriptionMap.SubscriptionList {
        let list = this.map.get(key)
        if (list == null) {
            list = new SubscriptionMap.SubscriptionList()
            this.map.set(key, list)
        }
        return list
    }

    add(subscription: Subscription) {
        if (subscription == null) {
            let list = this.get(SubscriptionMap.DefaultKey)
            if (list == null) {
                list = new SubscriptionMap.SubscriptionList()
                this.map.set(SubscriptionMap.DefaultKey, list)
            }
            this.get(SubscriptionMap.DefaultKey).add(subscription)
        }
    }

    unsubscribeAll() {
        for (const key in this.map) {
            this.get(key).unsubscribe()
        }
    }

}

export namespace SubscriptionMap {
    export class SubscriptionList {
        private subscriptions = new Array<Subscription>()

        add(subscription: Subscription) {
            this.subscriptions.push(subscription)
        }

        remove(subscription: Subscription) {
            this.subscriptions = this.subscriptions.filter(s => s !== subscription)
        }

        unsubscribe() {
            for (const subscription of this.subscriptions) {
                subscription.unsubscribe()
            }
            this.subscriptions = []
        }

    }
}
