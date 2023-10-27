import * as vscode from 'vscode'
import { Configuration } from '../ProjectManager/Configuration'
import { WithProgressRunner } from '../Utils/WithProgressRunner'
import { getDefaultErrorHandler } from '../Utils/ErrorHandler'

export abstract class HotspotDetectionRunner {
    private constructor() {
        throw new Error('This class cannot be instantiated')
    }

    public static async runConfiguration(
        configuration: Configuration
    ): Promise<void> {
        const state = {}
        const step1 = {
            message: 'Preparing build directory...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return s
            },
        }

        const step2 = {
            message: 'Running cmake...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return s
            },
        }

        const step3 = {
            message: 'Running make...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return s
            },
        }

        const step4a = {
            message: 'Running executable (1/5)...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return s
            },
        }

        const step4b = {
            message: 'Running executable (2/5)...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return s
            },
        }

        const step4c = {
            message: 'Running executable (3/5)...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return s
            },
        }

        const step4d = {
            message: 'Running executable (4/5)...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return s
            },
        }

        const step4e = {
            message: 'Running executable (5/5)...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return s
            },
        }

        const step5 = {
            message: 'Detecting Hotspots...',
            increment: 10,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                return s
            },
        }

        const step6a = {
            message: 'Parsing results (FileMapping)...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return s
            },
        }

        const step6b = {
            message: 'Parsing results (Hotspots)...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return s
            },
        }

        const step7 = {
            message: 'Preparing results...',
            increment: 5,
            operation: async (s: Partial<typeof state>) => {
                await new Promise((resolve) => setTimeout(resolve, 500))
                return s
            },
        }

        const operations = [
            step1,
            step2,
            step3,
            step4a,
            step4b,
            step4c,
            step4d,
            step4e,
            step5,
            step6a,
            step6b,
            step7,
        ]

        const withProgressRunner = new WithProgressRunner<typeof state>(
            'Simulating Hotspot Detection', // TODO
            vscode.ProgressLocation.Notification,
            true,
            operations,
            state,
            getDefaultErrorHandler('Hotspot Detection failed. ')
        )

        await withProgressRunner.run()
    }
}
