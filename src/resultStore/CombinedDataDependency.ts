export interface CombinedDataDependency {
    id: string
    dependentName: string
    type: string
    access: string
    fileId: number
    filePath: string
    originalLine: number
    mappedLine: number
}
