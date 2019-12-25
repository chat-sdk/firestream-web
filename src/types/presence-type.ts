import { BaseType } from './base-type'

export class PresenceType extends BaseType {

    static Unavailable = 'unavailable'
    static Busy = 'busy'
    static ExtendedAway = 'xa'
    static Available = 'available'

    constructor(type: BaseType | string) {
        super(type)
    }

    static unavailable(): PresenceType {
        return new PresenceType(this.Unavailable)
    }

    static busy(): PresenceType {
        return new PresenceType(this.Busy)
    }

    static extendedAway(): PresenceType {
        return new PresenceType(this.ExtendedAway)
    }

    static available(): PresenceType {
        return new PresenceType(this.Available)
    }

}
