import { Fireflyy } from '../fireflyy'

/**
 * Just a convenience method to make invocations of Fireflyy more compact
 * Fire.flyy.sendMessage()
 * instead of
 * Fireflyy.shared().sendMessage()
 */
export namespace Fire {
    export const flyy = Fireflyy.shared()
}
