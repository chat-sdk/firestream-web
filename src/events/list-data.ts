import { IJsonObject } from '../interfaces/json'

export class ListData {

    protected id: string
    protected data: IJsonObject

    constructor(id: string, data: IJsonObject) {
        this.id = id
        this.data = data
    }

    public get(key: string): any {
        if (this.data) {
            return this.data[key]
        }
    }

    public getId(): string {
        return this.id
    }

    public getData(): IJsonObject {
        return this.data
    }

}
