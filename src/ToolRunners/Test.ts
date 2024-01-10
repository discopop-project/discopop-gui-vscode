import { DiscoPoPRunner } from './Implementations/Pipeline/DiscoPoPRunner'
import { StdoutToolProgress } from './Implementations/Progress/StdoutToolProgress'
import {
    DiscoPoPExplorerOptions,
    DiscoPoPExplorerRunner,
} from './Implementations/SingleCommandTools/DiscopopExplorerRunner'

export async function runDiscoPoP() {
    console.log('STARTING FANCY NEW STUFF HERE')

    const dpRunner = new DiscoPoPRunner()

    await dpRunner.run(new StdoutToolProgress('DiscoPoP')) // TODO we want to pass the progress object to the constructor, not during the call to run

    const explorerRunner = new DiscoPoPExplorerRunner(
        new DiscoPoPExplorerOptions('somePWD')
    )

    await explorerRunner.run(new StdoutToolProgress('DiscoPoPExplorer'))

    console.log('FINISHED FANCY NEW STUFF HERE')
}
