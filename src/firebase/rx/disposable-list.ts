import { Subscription } from 'rxjs'

export class DisposableList {

    private disposables = new Array<Subscription>()

    add(disposable: Subscription) {
        this.disposables.push(disposable)
    }

    remove(disposable: Subscription) {
        this.disposables = this.disposables.filter(d => d !== disposable)
    }

    dispose() {
        for (const d of this.disposables) {
            d.unsubscribe()
        }
    }

}
