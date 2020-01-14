import { Equals } from '../interfaces/equals'

export class ArrayUtils {

    static filter<T extends Equals<T>>(list: T[], target: T, negative = false): T[] {
        if (negative) {
            return list.filter(item => !item.equals(target))
        } else {
            return list.filter(item => item.equals(target))
        }
    }
    
    static remove<T extends Equals<T>>(list: T[], target: T): T[] {
        return this.filter(list, target, true)
    }

}
