import { FireStream } from '../firestream'
import { IFireStream } from '../interfaces/firestream'

/**
 * Even more convenient! Just F.S.sendMessage()!
 */
export namespace F {
    export const S: IFireStream = FireStream.shared
    export const ire: IFireStream = FireStream.shared
}