import { User } from '../../chat'
import { FirebaseService } from './firebase-service'
import { Keys } from './keys'
import { Paths } from './paths'

export class MuteService {

    private static instance: MuteService

    protected muted: { [key: string]: Date } = {}

    static get shared() {
        if (!this.instance) {
            this.instance = new MuteService()
        }
        return this.instance
    }

    static add(id: string, until: Date) {
        this.shared.muted[id] = until
    }

    static remove(id: string) {
        delete this.shared.muted[id]
    }

    static mute(user: User | string, until?: Date): Promise<void> {
        if (typeof user === 'string') {
            return FirebaseService.core.mute(Paths.userMutedPath().child(user), {
                [Keys.Date]: until != null ? until.getTime() : Number.MAX_SAFE_INTEGER
            })
        } else {
            return this.mute(user.getId(), until)
        }
    }

    static unmute(user: User | string): Promise<void> {
        if (typeof user === 'string') {
            return FirebaseService.core.unmute(Paths.userMutedPath().child(user))
        } else {
            return this.unmute(user.getId())
        }
    }

    static mutedUntil(user: User | string): Date | undefined {
        if (typeof user === 'string') {
            return this.shared.muted[user]
        } else {
            return this.mutedUntil(user.getId())
        }
    }

    static isMuted(user: User | string): boolean {
        if (typeof user === 'string') {
            return this.mutedUntil(user) != null
        } else {
            return this.isMuted(user.getId())
        }
    }

}
