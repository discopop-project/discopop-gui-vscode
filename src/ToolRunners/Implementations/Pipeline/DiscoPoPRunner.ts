import { PipelinedToolRunner } from '../../PipelinedToolRunner'
import { ToolProgress } from '../../ToolProgress'
import { ToolRunner } from '../../ToolRunner'
import { StdoutToolProgress } from '../Progress/StdoutToolProgress'

export class DiscoPoPRunner extends PipelinedToolRunner {
    public constructor() {
        const steps: ToolRunner[] = [
            {
                description: 'Prepare Build Directory',
                run: async (progress: ToolProgress): Promise<void> => {
                    progress.reportMessageWithProgress(
                        'checking access privileges',
                        50
                    )
                    progress.reportMessageWithProgress(
                        'cleaning up before rebuild',
                        100
                    )
                },
            },
            {
                description: 'Run CMake',
                run: async (progress: ToolProgress): Promise<void> => {
                    progress.reportMessageWithProgress('TODO: ran cmake', 33)
                    progress.reportMessageWithProgress('TODO: cleaning up', 66)
                    progress.reportMessageWithProgress('TODO: done', 100)
                },
            },
            {
                description: 'Run Make',
                run: async (progress: ToolProgress): Promise<void> => {
                    progress.reportMessageWithProgress('TODO: run make', 100)
                },
            },
            {
                description: 'Run Instrumented Application',
                run: async (progress: ToolProgress): Promise<void> => {
                    progress.reportMessageWithProgress(
                        'TODO: run instrumented application',
                        100
                    )
                },
            },
            {
                description: 'Run Discopop Explorer',
                run: async (progress: ToolProgress): Promise<void> => {
                    progress.reportMessageWithProgress(
                        'TODO: run discopop explorer',
                        100
                    )
                },
            },
        ]

        super(
            steps,
            StdoutToolProgress.bind(null, '\t'),
            undefined,
            false,
            'DiscoPoP'
        )
    }

    public async run(progress: ToolProgress): Promise<void> {
        return super.run(progress)
    }

    public get description(): string {
        return 'DiscoPoP'
    }
}
