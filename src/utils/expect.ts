export const expect = <T>(value: T | null | undefined, label: string): T => {
    if (!value) {
        throw new Error(`Expected ${label} to not be undefined`)
    }
    return value
}
