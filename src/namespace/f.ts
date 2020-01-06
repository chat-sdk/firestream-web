import { FireStream } from '../firestream'

/**
 * Even more convenient! Just F.S.sendMessage()!
 */
export namespace F {
    export const S = FireStream.shared()
    export const ire = FireStream.shared()
}
