import { FireStream } from '../firestream'
import { IFireStream } from '../interfaces/firestream'

/**
 * Just a convenience method to make invocations of FireStream more compact
 * Fire.fly.sendMessage()
 * instead of
 * FireStream.shared().sendMessage()
 */
export namespace Fire {
    export const Stream: IFireStream = FireStream.shared
    export const api = (): IFireStream => FireStream.shared
    export const stream = (): IFireStream => FireStream.shared
}
