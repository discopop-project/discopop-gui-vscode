export interface ParsedResultSchema {
    /** reparse the results from the .discopop directory */
    update(dotDiscopop?: string)

    /** returns true if the parsing was successful.
     * If false: Call {@link error} to get a description of the error*/
    valid(): boolean

    /** returns a description of the error that occurred during parsing */
    error(): string
}
