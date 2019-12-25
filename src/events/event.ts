import * as firebase from 'firebase/app'

import { EventType } from './event-type'

export class Event {

    type: EventType

    constructor(type: EventType) {
        this.type = type
    }

    static typeForDocumentChange(change: firebase.firestore.DocumentChange): EventType {
        switch (change.type) {
            case 'added':
                return EventType.Added
            case 'removed':
                return EventType.Removed
            case 'modified':
                return EventType.Modified
            default:
                return EventType.None;
        }
    }

}
