import { Firefly } from '../firefly'

/**
 * Just a convenience method to make invocations of Firefly more compact
 * Fire.fly.sendMessage()
 * instead of
 * Firefly.shared().sendMessage()
 */
export namespace Fire {
    export const fly = Firefly.shared()
}
