import { Subject, Observable, merge, Observer } from 'rxjs'
import { map } from 'rxjs/operators'

enum EventType {
    Value,
    Error,
}

interface IEvent<T> {
    type: EventType,
    value?: T
    error?: any
}

export interface IMultiQueueObservable<T> {
    pastEvents(): Observable<T>
    newEvents(): Observable<T>
    allEvents(): Observable<T>
}

export class MultiQueueSubject<T> implements Observer<T> {

    protected queued = Array<IEvent<T>>()
    protected events = new Subject<T>()

    next(value: T) {
        if (this.events.observers.length > 0) {
            this.events.next(value)
        } else {
            this.queued.push({ type: EventType.Value, value })
        }
    }

    error(error: any) {
        if (this.events.observers.length > 0) {
            this.events.error(error)
        } else {
            this.queued.push({ type: EventType.Error, error })
        }
    }

    complete() {
        this.events.complete()
    }

    pastEvents() {
        return new Observable<T>(emitter => {
            for (const event of this.queued) {
                if (event.type === EventType.Value) {
                    emitter.next(event.value)
                }
                if (event.type === EventType.Error) {
                    emitter.error(event.error)
                }
            }
            this.queued = new Array<IEvent<T>>()
        })
    }

    newEvents() {
        return this.events.asObservable()
    }

    allEvents() {
        return merge(this.pastEvents(), this.newEvents())
    }

    map<S>(mapFunction: (value: T) => S) {
        const subject = new MultiQueueSubject<S>()
        subject.queued = this.queued.map(event => {
            return {
                type: event.type,
                value: event.value && mapFunction(event.value),
                error: event.error,
            }
        })
        this.events.pipe(map(mapFunction)).subscribe(subject)
        return subject
    }

    hide(): IMultiQueueObservable<T> {
        return {
            pastEvents: this.pastEvents,
            newEvents: this.newEvents,
            allEvents: this.allEvents,
        }
    }

}
