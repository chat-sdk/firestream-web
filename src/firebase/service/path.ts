export class Path {

    protected components = new Array<string>()

    /**
     * The remainder is used to fix an issue which arises with Firestore. In Firestore
     * there are documents and collections. But sometimes we want to reference information
     * that is at a path within a document for example:
     * chats/id/meta
     * Here the id, is a document but if we generated a path from this, it would point to a
     * collection. Therefore if the path we pass in to the ref doesn't point to the correct
     * reference type, we truncate it by one and set the remainder
     */
    protected remainder?: string

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
            return this.components[index]
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

    removeLast(): Path {
        if (this.components.length > 0) {
            this.components.pop()
        }
        return this
    }

    isDocument(): boolean {
        return this.size() % 2 === 0
    }

    getComponents(): string[] {
        return this.components
    }

    getRemainder(): string | undefined {
        return this.remainder
    }

    normalizeForDocument() {
        if (!this.isDocument()) {
            this.remainder = this.last()
            this.removeLast()
        }
    }

    normalizeForCollection() {
        if (this.isDocument()) {
            this.remainder = this.last()
            this.removeLast()
        }
    }

    /**
     * For Firestore to update nested fields on a document, you need to use a
     * dot notation. This method returns the remainder if it exists plus a
     * dotted path component
     * @param component path to extend
     * @return dotted components
     */
    dotPath(component: string): string {
        if (this.remainder) {
            return this.remainder + '.' + component
        } else {
            return component
        }
    }

}
