import { app, User } from 'firebase/app'

export class FirebaseProvider {

    private static instance: FirebaseProvider

    private _app?: app.App

    static get shared() {
        if (!this.instance) {
            this.instance = new FirebaseProvider()
        }
        return this.instance
    }

    static setApp(app?: app.App) {
        this.shared._app = app!
    }

    static get app(): app.App | undefined {
        return this.shared._app
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

}
