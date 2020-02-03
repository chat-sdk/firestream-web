import { database } from 'firebase/app'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { DataProvider, User } from '../../chat'
import { Event } from '../../events'
import { ListData } from '../../events/list-data'
import { FireStreamStore } from '../../firestream-store'
import { ISendable } from '../../interfaces'
import { Consumer } from '../../interfaces/consumer'
import { IJsonObject } from '../../interfaces/json'
import { Sendable } from '../../message/sendable'
import { RxUtils } from '../../utils/rx-utils'
import { FirebaseCoreHandler } from '../service/firebase-core-handler'
import { Keys } from '../service/keys'
import { Path } from '../service/path'
import { Ref } from './ref'
import { RxRealtime } from './rx-realtime'

export class RealtimeCoreHandler extends FirebaseCoreHandler {

    listChangeOn(path: Path): Observable<Event<ListData>> {
        return new RxRealtime().childOn(Ref.get(path)).pipe(map(change => {
            const key = change.snapshot.key
            const data = change.snapshot.val()
            const type = change.type
            if (key && data && type) {
                return new Event(new ListData(key, data), type)
            }
        }), RxUtils.filterTruthy)
    }

    deleteSendable(messagesPath: Path): Promise<void> {
        return new RxRealtime().delete(Ref.get(messagesPath))
    }

    async send(messagesPath: Path, sendable: ISendable, newId: Consumer<string>): Promise<void> {
        await new RxRealtime().add(Ref.get(messagesPath), sendable.toData(), FireStreamStore.timestamp(), newId)
    }

    addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        return this.addBatch(path, this.idsForUsers(users), this.dataForUsers(users, dataProvider))
    }

    removeUsers(path: Path, users: User[]): Promise<void> {
        return this.removeBatch(path, this.idsForUsers(users))
    }

    updateUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void> {
        return this.updateBatch(path, this.idsForUsers(users), this.dataForUsers(users, dataProvider))
    }

    async loadMoreMessages(messagesPath: Path, fromDate?: Date, toDate?: Date, limit?: number): Promise<ISendable[]> {
        let query = Ref.get(messagesPath) as database.Query
        query = query.orderByChild(Keys.Date)

        if (fromDate) {
            query = query.startAt(fromDate.getTime(), Keys.Date)
        }

        if (toDate) {
            query = query.endAt(toDate.getTime(), Keys.Date)
        }

        if (limit) {
            if (fromDate) {
                query = query.limitToFirst(limit)
            }
            if (toDate) {
                query = query.limitToLast(limit)
            }
        }

        const snapshot = await new RxRealtime().get(query)
        const sendables = new Array<ISendable>()
        snapshot?.forEach(child => {
            const sendable = this.sendableFromSnapshot(child)
            if (sendable) {
                sendables.push(sendable)
            }
        })
        return sendables
    }

    async dateOfLastSentMessage(messagesPath: Path): Promise<Date> {
        let query = Ref.get(messagesPath) as database.Query

        query = query.equalTo(FireStreamStore.userId || null)
        query = query.orderByChild(Keys.From)
        query = query.limitToLast(1)

        const snapshot = await new RxRealtime().get(query)
        if (snapshot) {
            const sendable = this.sendableFromSnapshot(snapshot)
            if (sendable.getDate()) {
                return sendable.getDate()
            }
        }
        return new Date(0)
    }

    sendableFromSnapshot(snapshot: database.DataSnapshot): ISendable {
        const sendable = new Sendable()
        if (snapshot.key) {
            sendable.setId(snapshot.key)
        }
        if (snapshot.hasChild(Keys.From)) {
            sendable.setFrom(snapshot.child(Keys.From).val())
        }
        if (snapshot.hasChild(Keys.Date)) {
            const timestamp = snapshot.child(Keys.Date).val()
            if (timestamp) {
                sendable.setDate(new Date(timestamp))
            }
        }
        if (snapshot.hasChild(Keys.Type)) {
            sendable.setType(snapshot.child(Keys.Type).val())
        }
        if (snapshot.hasChild(Keys.Body)) {
            sendable.setBody(snapshot.child(Keys.Body).val())
        }
        return sendable
    }

    messagesOn(messagesPath: Path, newerThan: Date, limit: number): Observable<Event<ISendable>> {
        let query = Ref.get(messagesPath) as database.Query

        query = query.orderByChild(Keys.Date)
        if (newerThan) {
            query = query.startAt(newerThan.getTime(), Keys.Date)
        }
        query = query.limitToLast(limit)

        return new RxRealtime().childOn(query).pipe(map(change => {
            const sendable = this.sendableFromSnapshot(change.snapshot)
            const type = change.type
            if (sendable && type) {
                return new Event(sendable, type)
            }
        }), RxUtils.filterTruthy)
    }

    protected removeBatch(path: Path, keys: string[]): Promise<void> {
        return this.updateBatch(path, keys)
    }

    protected addBatch(path: Path, keys: string[], values?: IJsonObject[]): Promise<void> {
        return this.updateBatch(path, keys, values)
    }

    protected async updateBatch(path: Path, keys: string[], values?: IJsonObject[]): Promise<void> {
        const data: IJsonObject = {}

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const value = values ? values[i] : null
            data[path.toString() + '/' + key] = value
        }

        return Ref.db().ref().update(data)
    }

    protected idsForUsers(users: User[]): string[] {
        return users.map(user => user.getId())
    }

    protected dataForUsers(users: User[], provider: DataProvider): IJsonObject[] {
        return users.map(user => provider.data(user))
    }

    mute(path: Path, data: IJsonObject): Promise<void> {
        return new RxRealtime().set(Ref.get(path), data)
    }

    unmute(path: Path): Promise<void> {
        return new RxRealtime().delete(Ref.get(path))
    }

}
