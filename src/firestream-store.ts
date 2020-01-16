import { app, User } from 'firebase/app'

import { Config } from './config'

export class FireStreamStore {

    private static instance: FireStreamStore

    private _app?: app.App
    private _config?: Config

    static get shared() {
        if (!this.instance) {
            this.instance = new FireStreamStore()
        }
        return this.instance
    }

    static setApp(app?: app.App) {
        this.shared._app = app
    }

    static get app(): app.App | undefined {
        return this.shared._app
    }

    static setConfig(config?: Config) {
        this.shared._config = config
    }

    static get config(): Config {
        if (!this.shared._config) {
            throw new Error('FireStreamStore.config needs to be set')
        }
        return this.shared._config
    }

    static get user(): User | undefined {
        return this.shared._app?.auth().currentUser || undefined
    }

    /**
     * Get the User ID of the currently authenticated user.
     * @throws if no user is authenticated
     */
    static get userId(): string {
        if (!this.user) {
            throw new Error('User is not authenticated')
        }
        return this.user.uid
    }

    /**
     * Return a Firebase timestamp object
     * @return appropriate server timestamp object
     */
    static timestamp(): any {
        return new Date()
    }

    static debug(text: string) {
        if (this.config.debugEnabled) {
            console.log(text)
        }
    }

}
