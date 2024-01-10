import { ToolProgress } from './ToolProgress'

export interface ToolRunner {
    /** runs the tool with any progress being reported to the passed `progress` object */
    run(progress: ToolProgress): Promise<void>

    /** human readable description, preferrably short, e.g. the tool's name */
    get description(): string
}
