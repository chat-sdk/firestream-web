import { FireStream } from '../firestream'

/**
 * Just a convenience method to make invocations of FireStream more compact
 * Fire.Stream.sendMessage()
 * instead of
 * FireStream.shared().sendMessage()
 */
export namespace Fire {
    export const Stream = FireStream.shared()
    export const api = () => FireStream.shared()
}
