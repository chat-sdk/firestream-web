import { Observable } from 'rxjs'
import { filter } from 'rxjs/operators'

export class RxUtils {

    static filterTruthy<T>(observable: Observable<T | undefined | null>): Observable<T> {
        return observable.pipe(filter(Boolean)) as Observable<T>
    }

}
