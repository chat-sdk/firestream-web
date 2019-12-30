export class Path {

    protected components = new Array<string>()

    constructor(path: string[] | string) {
        if (typeof path === 'string') {
            path = path.split('/')
        }
        for (const component of path) {
            if (component) {
                this.components.push(component)
            }
        }
    }

    first(): string {
        return this.components[0]
    }

    last(): string {
        return this.components[this.size()-1]
    }

    size(): number {
        return this.components.length
    }

    get(index: number): string | undefined {
        if (this.size() > index) {
            return this.components[index];
        }
    }

    toString(): string {
        let path = ''
        for (const component of this.components) {
            path = path + '/' + component
        }
        return path
    }

    child(child: string): Path {
        this.components.push(child)
        return this
    }

    children(...children: string[]): Path {
        this.components.push(...children)
        return this
    }

    getComponents(): string[] {
        return this.components
    }

}
