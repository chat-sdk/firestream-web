import { FirebaseService } from '../firebase/service/firebase-service'
import { Keys } from '../firebase/service/keys'
import { IJson } from '../interfaces/json'

export class Meta {

    protected name = ''
    protected imageURL = ''
    protected created?: Date
    protected data: IJson = {}
    protected timestamp: any
    protected wrapped = false

    constructor(name?: string, imageURL?: string, data?: IJson, created?: Date) {
        this.name = name || this.name
        this.imageURL = imageURL || this.imageURL
        this.data = data || this.data
        this.created = created || this.created
    }

    getName(): string {
        return name
    }

    setName(name: string): Meta {
        this.name = name
        return this
    }

    getImageURL(): string {
        return this.imageURL
    }

    setImageURL(imageURL: string): Meta {
        this.imageURL = imageURL
        return this
    }

    setData(data: IJson): Meta {
        this.data = data
        return this
    }

    getData(): IJson {
        return this.data
    }

    addTimestamp(): Meta {
        this.timestamp = FirebaseService.core.timestamp()
        return this
    }

    wrap(): Meta {
        this.wrapped = true
        return this
    }

    getCreated(): Date | undefined {
        return this.created
    }

    setCreated(created?: Date) {
        this.created = created
    }

    static nameData(name: string): IJson {
        return {
            [Keys.Name]: name
        }
    }

    static imageURLData(imageURL: string): IJson {
        return {
            [Keys.ImageURL]: imageURL
        }
    }

    static dataData(data: IJson): IJson {
        return {
            [Keys.Data]: data
        }
    }

    toData(includeTimestamp = false): IJson {
        const data: IJson = {}

        if (name != null) {
            data[Keys.Name] = this.name
        }
        if (this.imageURL != null) {
            data[Keys.ImageURL] = this.imageURL
        }
        if (this.data != null) {
            data[Keys.Data] = this.data
        }
        if (this.timestamp != null) {
            data[Keys.Created] = this.timestamp
        }
        if (this.wrapped) {
            return Meta.wrap(data)
        }
        return data
    }

    protected static wrap(map: IJson): IJson {
        return {
            [Keys.Meta]: map
        }
    }

    copy(): Meta {
        return new Meta(this.name, this.imageURL, this.data, this.created)
    }

    static from(name: string, imageURL: string, data?: IJson): Meta {
        return new Meta(name, imageURL, data)
    }

}
