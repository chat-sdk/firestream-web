export enum ConnectionEventType {
    WillConnect,
    DidConnect,
    WillDisconnect,
    DidDisconnect,
}

export class ConnectionEvent {

    protected type: ConnectionEventType

    protected constructor(type: ConnectionEventType) {
        this.type = type
    }

    static willConnect(): ConnectionEvent {
        return new ConnectionEvent(ConnectionEventType.WillConnect);
    }

    static didConnect(): ConnectionEvent {
        return new ConnectionEvent(ConnectionEventType.DidConnect);
    }

    static willDisconnect(): ConnectionEvent {
        return new ConnectionEvent(ConnectionEventType.WillDisconnect);
    }

    static didDisconnect(): ConnectionEvent {
        return new ConnectionEvent(ConnectionEventType.DidDisconnect);
    }

    getType(): ConnectionEventType {
        return this.type
    }

}
