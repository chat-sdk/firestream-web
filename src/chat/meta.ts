import { IJson } from '../interfaces/json'
import { Keys } from '../firebase/service/keys'
import { FireStream } from '../firestream'

export class Meta {

    protected name = ''
    protected imageURL = ''
    protected created?: Date
    protected data: IJson = {}

    constructor(name?: string, imageURL?: string, created?: Date) {
        this.name = name || this.name
        this.imageURL = imageURL || this.imageURL
        this.created = created || this.created
    }

    getName(): string {
        return name
    }

    setName(name: string) {
        this.name = name
    }

    getImageURL(): string {
        return this.imageURL
    }

    setImageURL(imageURL: string) {
        this.imageURL = imageURL
    }

    setData(data: IJson) {
        this.data = data
    }

    getData(): IJson {
        return this.data
    }

    getCreated(): Date | undefined {
        return this.created
    }

    setCreated(created?: Date) {
        this.created = created
    }

    toData(includeTimestamp = false): IJson {
        const toWrite: IJson = {}

        toWrite[Keys.Name] = this.name
        toWrite[Keys.ImageURL] = this.imageURL
        toWrite[Keys.Data] = this.data

        if (includeTimestamp) {
            toWrite[Keys.Created] = FireStream.shared().getFirebaseService().core.timestamp()
        }

        const meta: IJson = {
            [Keys.Meta]: toWrite
        }

        return meta
    }

    copy(): Meta {
        const meta = new Meta(this.name, this.imageURL, this.created)
        meta.data = this.data
        return meta
    }

    static with(name: string, imageURL: string): Meta {
        return new Meta(name, imageURL)
    }

}
