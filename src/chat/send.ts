import { FirebaseService } from '../firebase/service/firebase-service'
import { Path } from '../firebase/service/path'
import { Paths } from '../firebase/service/paths'
import { Consumer } from '../interfaces/consumer'
import { ISendable } from '../interfaces/sendable'

export class Send {

    /**
     * Send a message to a messages ref
     * @param messagesPath
     * @param sendable item to be sent
     * @param newId the ID of the new message
     * @return single containing message id
     */
    static toPath(messagesPath: Path, sendable: ISendable, newId?: Consumer<string>): Promise<void> {
        return FirebaseService.core.send(messagesPath, sendable, newId)
    }

    static toUserId(toUserId: string, sendable: ISendable, newId?: Consumer<string>): Promise<void> {
        return this.toPath(Paths.messagesPath(toUserId), sendable, newId)
    }

}
