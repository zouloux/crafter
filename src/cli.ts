import { CLICommands } from "@zouloux/cli";
import { loadCrafter } from "./crafter"

CLICommands.start((commandName, error, cliArguments, cliOptions, results) => {
	console.log("START", commandName, error, cliArguments, cliOptions, results)

	loadCrafter(" ")
})