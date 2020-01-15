import { Equals } from '../interfaces/equals'

export class ArrayUtils {

    static filter<T extends Equals<T>>(list: T[], target: T, negative = false): T[] {
        if (negative) {
            return list.filter(item => !item.equals(target))
        } else {
            return list.filter(item => item.equals(target))
        }
    }
    
    static remove<T extends Equals<T>>(list: T[], ...targets: T[]): T[] {
        if (targets.length === 1) {
            return this.filter(list, targets[0], true)
        } else {
            let filtered = [ ...list ]
            for (const target of targets) {
                filtered = this.filter(filtered, target, true)
            }
            return filtered
        }
    }

}
