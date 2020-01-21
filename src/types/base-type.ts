export class BaseType {

    protected type: string

    constructor(type: BaseType | string) {
        if (type instanceof BaseType) {
            this.type = type.get()
        } else {
            this.type = type || ''
        }
    }

    get(): string {
        return this.type
    }

    equals(type?: BaseType): boolean {
        return this.get() === type?.get()
    }

    static none(): BaseType {
        return new BaseType('')
    }

    is(type?: BaseType): boolean {
        return this.equals(type)
    }

}
