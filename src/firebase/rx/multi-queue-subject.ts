import { BehaviorSubject, Observable, Observer, ReplaySubject, Subject } from 'rxjs'
import { filter, map } from 'rxjs/operators'

export interface IMultiQueueObservable<T> {
    newEvents(): Observable<T>
    allEvents(): Observable<T>
    sinceLastEvent(): Observable<T>
}

export class MultiQueueSubject<T> implements Observer<T> {

    protected subject = new Subject<T>()
    protected replaySubject = new ReplaySubject<T>()
    protected behaviorSubject = new BehaviorSubject<T>((null as unknown) as T)

    next(value: T) {
        if (this.subject.observers.length > 0) {
            this.subject.next(value)
        }
        this.replaySubject.next(value)
        this.behaviorSubject.next(value)
    }

    error(err: any) {
        if (this.subject.observers.length > 0) {
            this.subject.error(err)
        }
        this.replaySubject.error(err)
        this.behaviorSubject.error(err)
    }

    complete() {
        this.subject.complete()
        this.replaySubject.complete()
        this.behaviorSubject.complete()
    }

    newEvents() {
        return this.subject.asObservable()
    }

    allEvents() {
        return this.replaySubject.asObservable()
    }

    sinceLastEvent() {
        return this.behaviorSubject.pipe(filter(e => e != null))
    }

    map<S>(mapFunction: (value: T) => S) {
        const multiQueueSubject = new MultiQueueSubject<S>()
        this.replaySubject.pipe(map(mapFunction)).subscribe(multiQueueSubject)
        return multiQueueSubject
    }

    hide(): IMultiQueueObservable<T> {
        return {
            newEvents: this.newEvents,
            allEvents: this.allEvents,
            sinceLastEvent: this.sinceLastEvent,
        }
    }

}
