# crafter

Crafter is configurable and powerful file scaffolder.
It can scaffold pretty much any ASCII file.

Crafter is based on :
- NodeJS
- [@zouloux/cli](https://github/zouloux/cli) to ask questions
- [@zouloux/files](https://github/zouloux/files) for file manipulations
- [stach](https://github/zouloux/stach) for templating

### Install

`npm i -D @zouloux/crafter`

### Usage

```bash
craft $CRAFTER_PATH $APP_PATH
craft ./crafters/reflex/reflex-crafter.js ./src/my-app/
```

### In package scripts

```json
{
  "scripts" : {
	"craft-reflex": "craft ./crafters/reflex/reflex-crafter.js ./src/front/",
	"craft-route": "craft ./crafters/fastify/fastify-crafter.js ./src/back/"
  }
}
```

### Crafter file

A Crafter file is a JS file which create craft actions.
Craft actions create a menu for the user. A craft action can ask user questions and scaffold files from those questions.

`crafters/reflex-crafter.js`
```tsx
import { askInput } from "@zouloux/cli"

// createCraftAction( crafterID:string, menuEntry:string, async (crafterRoot?:string, appPath?:string, env?:TEnv) => { ... } )
createCraftAction('symbol', 'Symbol (icons / logos ...)', async (craft, crafterRoot, appPath, env) => {
	// Ask user for category name
	const category = await askInput(
		// Uses nicePrint to style text, @see https://github.com/zouloux/cli/blob/main/src/Output.ts#L67
		// {u} -> underline
		// {/} -> remove previous styling
		// {d} -> dim
		`Symbol {u}c{/}ategory folder ? {d}(use plural) ex: icons, logos ...`,
		{ shortcuts: ['category', 'cat', 'c'], notEmpty: true }
	);
	// Ask user for symbol name
	const name = await askInput(
		`Symbol {u}n{/}ame ? {d}(use CamelCase, with category as suffix) ex : HomeIcon, BrandLogo, ...`,
		{ shortcuts: ['name', 'n'], notEmpty: true }
	);
	// Scaffold with those parameters
	// craft <GVars extends object>( vars:GVars, steps:TStep<GVars>[] )
	craft({
		// Those will be avaible in source template
		category: category.toLowerCase(),
		name: lowerCaseFirst( name ),
		Name: upperCaseFirst( name ),
	}, [
		vars => [
			// Source is templated with vars given
			// relative to $CRAFTER_PATH from cli
			`1-symbols/Name.tsx.template`,
			// And templated file is written here
			// relative to $APP_PATH from cli
			`1-symbols/${vars.category}/${vars.Name}.tsx`
		],
		// Can have other steps (other files templated)
		vars => [
			// ...
		]
	])
})
```

Step can also be a custom async function without auto-templating

```tsx
createCraftAction('app', 'App', async (craft, crafterRoot, appPath, env) => {
	// Ask user questions
	// ...
	craft({
		name: lowerCaseFirst( name )
	}, [
		// A step can be custom if it does not return a tuple
		// Custom step ( no auto-templating, do anything you want using cli and files )
		async (vars) => {
			// Check if app already exists
			if ( await FileFinder.exists( appPath ) )
				throw new Error(`Reflex crafter, app ${vars.name} already exists`)
			// Clone app template with all directories
			const appTemplate = new Directory( path.join(crafterPath, '_app') )
			const children = await appTemplate.children('all', { dot: true })
			for ( const child of children )
				await child.copyTo( appPath )
			// Remove all gitkeeps
			const gitKeeps = await FileFinder.find('file', `src/**/.gitkeep`, { dot: true })
			for ( const gitKeep of gitKeeps )
				await gitKeep.delete()
		}
	])
})
```

### Templates

Those files are templated with `vars` thanks to [stach](https://github.com/zouloux/stach).
Template delimiters are `{{varName}}`

`crafter/1-symbols/Name.tsx.template`

```tsx
import { h, DefaultReflexProps } from "@zouloux/reflex";

interface Props extends DefaultReflexProps {

}

export function {{Name}} ( props:Props ) {
	return <svg fill="currentColor" viewBox="0 0 40 40"></svg>
}
```

### Examples

See examples here : 
- [Simple crafter example](./examples/simple)

To test example :
```
git clone https://github.com/zouloux/crafter
cd examples/simple
npm i
npm run craft
```
