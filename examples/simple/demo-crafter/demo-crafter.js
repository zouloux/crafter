import path from "path";
import { createCraftAction } from "@zouloux/crafter";
import { File } from "@zouloux/files"
import { askInput } from "@zouloux/cli"
import { lowerCaseFirst, upperCaseFirst } from "@zouloux/ecma-core";

createCraftAction("component", 'Create a demo component', async (craft, crafterPath, appPath) => {
	const name = await askInput(
		`Component {u}n{/}ame ? {d}(use CamelCase, with kind in name but without "Component") ex : BigButton`,
		{ shortcuts: ['name', 'n'], notEmpty: true }
	);
	craft({
		name: lowerCaseFirst( name ),
		Name: upperCaseFirst( name ),
	}, [
		vars => [
			`components/Name.tsx.template`,
			`components/${vars.name}/${vars.Name}.tsx`
		],
		vars => [
			`components/Name.module.less.template`,
			`components/${vars.name}/${vars.Name}.module.less`
		],
	])
})

createCraftAction("custom", "Use custom crafter", async (craft, crafterPath, appPath) => {
	const key = await askInput(
		`API {u}K{/}ey ?`,
		{ shortcuts: ['key', 'k'], notEmpty: true }
	);
	craft({ key }, [
		async vars => {
			// Load existing .env
			const dotEnvFile = new File( path.join(appPath, ".env") )
			const keyName = "API_KEY"
			await dotEnvFile.load()
			// Add API_KEY to .env file
			dotEnvFile.dotEnv( data => {
				data[ keyName ] = vars.key
				return data
			})
			// Save .env, will create a new file if not existing
			await dotEnvFile.save()
		}
	])
})
