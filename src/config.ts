import { ErrorMessage } from './error-messages'

export class Config {

    /**
     * Should the framework automatically send a delivery receipt when
     * a message is received
     */
    deliveryReceiptsEnabled = true

    /**
     * Should the framework send the received receipt automatically
     */
    autoMarkReceived = true

    /**
     * Are chat chat invites accepted automatically
     */
    autoAcceptChatInvite = true

    /**
     * If this type enabled, each time a message type received, it will be
     * deleted from our inbound message queue childOn Firestore. Even if this
     * type set to false, typing indicator messages and presence messages will
     * always be deleted as they don't have any use in the message archive
     * this flag only affects 1-to-1 messages.
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
    protected sandbox = 'prod'

    /**
     * When should we add the message listener from? By default
     * we set this to the date of the last message or receipt
     * we sent. This is the most efficient way because each message
     * will be downloaded exactly once.
     *
     * In some situations it may not be desirable. Especially because
     * clients will only pick up remote delete events since the last
     * sent date.
     *
     * If you want messages to be retrieved for a longer history, you
     * can set this to false.
     *
     * If this is set to false, you will need to be careful if you are
     * using read receipts because the framework won't know whether it
     * has already sent an automatic receipt for a message. To resolve
     * this there are two options, you can set {@link Config#autoMarkReceived}
     * to false or you can use the set the read receipt filter
     * {@link Filter#setMarkReceivedFilter(Predicate)}
     *
     * Fire.stream().setMarkReceivedFilter(event => {
     *     return !YourMessageStore.getMessageById(event.get().getId()).isMarkedReceived();
     * });
     *
     * So if the message receipt has been sent already return false, otherwise
     * return true
     *
     */
    startListeningFromLastSentMessageDate = true

    /**
     * This will listen to messages with a duration before
     * the current date. For example, if we set the duration to 1 week,
     * we will start listening to messages that have been received in
     * the last week. If it is set to null there will be no limit,
     * we will listed to all historic messages
     *
     * This also is in effect in the case that the {@link Config#startListeningFromLastSentMessageDate }
     * is set to true, in that case, if there are no messages or receipts in the queue,
     * the listener will be set with this duration ago
     * */
    listenToMessagesWithTimeAgo = Config.TimePeriod.infinite()

    /**
     * Which database to use - Firestore or Realtime database
     */
    database = Config.DatabaseType.Realtime

    /**
     * Should debug log messages be shown?
     */
    debugEnabled = false

    setRoot(root: string) {
        if (this.pathValid(this.root)) {
            this.root = root;
        } else {
            throw new Error(ErrorMessage.invalid_path)
        }
    }

    setSandbox(sandbox: string) {
        if (this.pathValid(this.sandbox)) {
            this.sandbox = sandbox;
        } else {
            throw new Error(ErrorMessage.invalid_path)
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
    export class TimePeriod {

        seconds: number

        protected constructor(seconds: number) {
            this.seconds = seconds
        }

        public static seconds(seconds: number): TimePeriod {
            return new TimePeriod(seconds)
        }

        public static minutes(minutes: number): TimePeriod {
            return this.seconds(minutes * 60)
        }

        public static hours(hours: number): TimePeriod {
            return this.minutes(hours * 60)
        }

        public static days(days: number): TimePeriod {
            return this.hours(days * 24)
        }

        public static weeks(weeks: number): TimePeriod {
            return this.days(weeks * 7)
        }

        public static months(months: number): TimePeriod {
            return this.days(months * 30)
        }

        public static infinite(): TimePeriod {
            return this.seconds(-1)
        }

        public getDate(): Date {
            if (this.seconds < 0) {
                return new Date(0)
            } else {
                return new Date(new Date().getTime() - this.seconds * 1000)
            }
        }

    }
}
