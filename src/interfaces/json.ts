export interface IJsonObject {
    [x: string]: TJsonValue
}

export type TJsonValue = undefined | null | string  | number | boolean | Date | IJsonObject
