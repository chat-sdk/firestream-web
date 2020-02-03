import { Observable } from 'rxjs'

import { DataProvider, User } from '../../chat/user'
import { Event } from '../../events'
import { ListData } from '../../events/list-data'
import { Consumer } from '../../interfaces/consumer'
import { ISendable } from '../../interfaces/sendable'
import { Path } from './path'

export abstract class FirebaseCoreHandler {

    /**
     * Listen for changes in the value of a list reference
     *
     * @param path to listen to
     * @return events of list events
     */
    abstract listChangeOn(path: Path): Observable<Event<ListData>>

    /**
     * Delete a sendable from our queue
     *
     * @param messagesPath
     * @return completion
     */
    abstract deleteSendable(messagesPath: Path): Promise<void>

    /**
     * Send a message to a messages ref
     *
     * @param messagesPath Firestore reference for message collection
     * @param sendable item to be sent
     * @param newId get the id of the new message before it's sent
     * @return completion
     */
    abstract send(messagesPath: Path, sendable: ISendable, newId?: Consumer<string>): Promise<void>

    /**
     * Add users to a reference
     *
     * @param path for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param users        to add
     * @return completion
     */
    abstract addUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void>

    /**
     * Remove users from a reference
     *
     * @param path  for users
     * @param users to remove
     * @return completion
     */
    abstract removeUsers(path: Path, users: User[]): Promise<void>

    /**
     * Update users for a reference
     * @param path for users
     * @param dataProvider a callback to extract the data to add from the user
     *                     this allows us to use one method to write to multiple different places
     * @param users to update
     * @return completion
     */
    abstract updateUsers(path: Path, dataProvider: DataProvider, users: User[]): Promise<void>

    /**
     * Get a updateBatch of messages once
     * @param messagesPath
     * @param fromDate get messages from this date
     * @param toDate get messages until this date
     * @param limit limit the maximum number of messages
     * @return a events of message results
     */
    abstract loadMoreMessages(messagesPath: Path, fromDate?: Date, toDate?: Date, limit?: number): Promise<ISendable[]>

    /**
     * This method gets the date of the last delivery receipt that we sent - i.e. the
     * last message WE received.
     * @param messagesPath
     * @return single date
     */
    abstract dateOfLastSentMessage(messagesPath: Path): Promise<Date>

    /**
     * Start listening to the current message reference and pass the messages to the events
     * @param messagesPath
     * @param newerThan only listen for messages after this date
     * @param limit limit the maximum number of historic messages
     * @return a events of message results
     */
    abstract messagesOn(messagesPath: Path, newerThan?: Date, limit?: number): Observable<Event<ISendable>>

}
