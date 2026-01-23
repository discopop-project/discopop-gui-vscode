import * as fs from 'fs'

export interface StaticDependency {
    dependentName: string
    type: string
    access: string
    fileId: number
    line: number
}

export class StaticDependencies {
    public readonly staticDependencies: Map<string, StaticDependency[]> =
        new Map<string, StaticDependency[]>()
    constructor(private _dotDiscopop?: string) {
        if (_dotDiscopop) {
            this.update(_dotDiscopop)
        } else {
            this._valid = false
            this._error = `no .discopop directory provided`
        }
    }

    public update(dotDiscopop: string = this._dotDiscopop): void {
        // reset internals
        this._dotDiscopop = dotDiscopop
        this.staticDependencies.clear()

        const filePath = `${dotDiscopop}/profiler/static_dependencies.txt`

        if (!fs.existsSync(filePath)) {
            this._valid = false
            this._error = `patterns.json does not exist in any of the expected locations`
            return
        }

        this._parseFile(filePath)
    }

    private _valid = false
    public valid(): boolean {
        return this._valid
    }

    private _error: string | undefined = undefined
    public get error(): string | undefined {
        return this._error
    }

    private _parseFile(path: string): void {
        try {
            // parse
            console.log('reading patterns from ' + path)
            const fileContents = fs.readFileSync(path, 'utf-8')
            const lines = fileContents.split(/\r?\n/)

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim()
                if (line === '') {
                    continue
                }

                const parts = line.split(' ')
                const lastPart = parts.at(-1).split('|').at(-1)
                const id = lastPart.split('(').at(-1).split(')')[0]
                const dependentName = lastPart.split('(')[0]
                const access = parts[2]

                // Function starts and objects not considered
                if (dependentName === 'retval' || dependentName === 'this') {
                    continue
                }

                if (
                    access === 'INIT' ||
                    access === 'WAW' ||
                    access === 'WAR' ||
                    'RAW'
                ) {
                    const staticDependecy: StaticDependency = {
                        dependentName: dependentName,
                        type: parts[1],
                        access: access,
                        fileId: Number(parts[0].split(':')[0]),
                        line: Number(parts[0].split(':')[1]),
                    }

                    let dependecies = this.staticDependencies.get(id)

                    if (!dependecies) {
                        dependecies = []
                        this.staticDependencies.set(id, dependecies)
                    }

                    dependecies.push(staticDependecy)
                }
            }

            // mark as valid
            this._valid = true
            this._error = undefined
        } catch (error: any) {
            this._valid = false
            console.log(error)
            this._error = 'Error parsing static_dependencies.txt'
        }
    }
}
