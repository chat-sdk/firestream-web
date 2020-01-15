export class Config {

    /**
     * Should the framework automatically send a delivery receipt when
     * a message is received
     */
    deliveryReceiptsEnabled = true

    /**
     * Are chat chat invites accepted automatically
     */
    autoAcceptChatInvite = true

    /**
     * If this is enabled, each time a message is received, it will be
     * deleted from our inbound message queue childOn Firestore. Even if this
     * is set to false, typing indicator messages and presence messages will
     * always be deleted as they don't have any use in the message archive
     */
    deleteMessagesOnReceipt = false

    /**
     * How many historic messages should we retrieve?
     */
    messageHistoryLimit = 100

    /**
     * This will be the root of the FireStream Firebase database i.e.
     * /root/[sandbox]/users
     */
    protected root = 'firestream'

    /**
     * This will be the sandbox of the FireStream Firebase database i.e.
     * /root/[sandbox]/users
     */
    protected sandbox = 'pepe'

    /**
     * Which database to use - Firestore or Realtime database
     */
    database = Config.DatabaseType.Firestore

    /**
     * Should debug log messages be shown?
     */
    debugEnabled = false

    setRoot(root: string) {
        if (this.pathValid(this.root)) {
            this.root = root;
        } else {
            throw new Error('R.string.error_invalid_path')
        }
    }

    setSandbox(sandbox: string) {
        if (this.pathValid(this.sandbox)) {
            this.sandbox = sandbox;
        } else {
            throw new Error('R.string.error_invalid_path')
        }
    }

    protected pathValid(path: string): boolean {
        if (!path) return false
        return /^[0-9A-Za-z_]+$/.test(path)
    }

    getRoot(): string {
        return this.root
    }

    getSandbox(): string {
        return this.sandbox
    }

}

export namespace Config {
    export enum DatabaseType {
        Firestore,
        Realtime
    }
}
