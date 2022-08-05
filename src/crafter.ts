import { askList, nicePrint, oraTask } from "@zouloux/cli";
import { File, FileFinder } from "@zouloux/files";
import * as path from "path";

// ----------------------------------------------------------------------------- TYPES

// Var bag for templating as { "key": "value" }
export type TVars = Record<string, string|number|boolean>

// Loaded env bag as { "key": "value" }
export type TEnv = Record<string, string>

// Craft step as ( vars ) => [ from, to ] or ( vars ) => void
export type TStep <GVars extends TVars = TVars> = (vars:GVars) => void | [ string, string ]

// Crafter function with vars as first argument and steps as second argument
export type TCrafter<GVars extends TVars = TVars> = ( vars:GVars, steps:TStep[] ) => void|Promise<void>

// Craft action function
export type TCraftActionFunction = ( crafter:TCrafter, crafterRoot?:string, appPath?:string, env?:TEnv ) => Promise<void>

// Craft action item
interface ICraftActionItem {
	id			:string,
	menuEntry	:string
	action		:TCraftActionFunction
}

// List of craft action items in a record
type TCraftActionItems = {[id:string]:ICraftActionItem}

// ----------------------------------------------------------------------------- LOAD CRAFTER

// Get last registered craft action items
function getCraftActions ():TCraftActionItems {
	// We use global because crafter module can have multiple instances
	return global.__craftActions
}

// Load a crafter and its craft actions
export async function loadCrafter ( crafterPath:string, appPath:string, actionID?:string ) {
	// Add index.js if we are on a directory
	if ( !path.parse( crafterPath ).ext )
		crafterPath = path.join( crafterPath, 'index.js' )
	// console.log( "loadCrafter", crafterPath, appPath, actionID )
	global.__craftActions = {}
	await import( crafterPath )
	const craftActions = getCraftActions()
	// console.log('Craft actions', craftActions);
	if ( actionID ) {
		if ( !(actionID in craftActions) )
			nicePrint(`{b/r}Action with id ${actionID} not found in crafter ${crafterPath}`, { code: 4 })
	}
	else {
		actionID = await showCrafterMenu( craftActions )
	}
	// Load dot env
	// TODO : Add parameter to be able to load custom .env
	const dotEnvPath = path.join( process.cwd(), ".env" )
	const dotEnvFile = new File( dotEnvPath )
	let env:TEnv = {}
	if ( await dotEnvFile.exists() ) {
		await dotEnvFile.load()
		env = await dotEnvFile.dotEnv() as TEnv
	}
	// Target crafter root
	const crafterRoot = path.dirname( crafterPath )
	await executeCrafterAction( craftActions[ actionID ], crafterRoot, appPath, env )
	global.__craftActions = null;
}

async function showCrafterMenu ( craftActions:TCraftActionItems ) {
	let menu = {}
	for ( const key in craftActions )
		menu[ key ] = craftActions[ key ].menuEntry
	return await askList('What do you want to craft ?', menu, { returnType: 'key' })
}

async function executeCrafterAction ( action:ICraftActionItem, crafterRoot:string, appPath:string, env:TEnv ) {
	//console.log("> executeCrafterAction", action)
	const localCrafter:TCrafter = async ( vars:TVars, steps:TStep[] ) => {
		await oraTask(`Generating files`, async ( task ) => {
			// Browse steps to execute
			const generatedSteps = []
			let stepIndex = 0;
			const totalStep = steps.length - 1
			for ( const step of steps ) {
				task.setProgress( stepIndex ++, totalStep )
				try {
					// Execute crafter step
					const fileReturn = await step( vars )
					// Check return type, if it's not a tuple
					if ( !Array.isArray(fileReturn) || fileReturn.length !== 2 ) {
						generatedSteps.push('')
						continue;
					}
					// Get from path and to path
					let [ from, to ] = fileReturn
					from = path.join( crafterRoot, from )
					to = path.join( appPath, to )
					// Check if crafter file exists
					if ( !(await FileFinder.exists( from )) )
						task.error(`Crafter file ${from} does not exists`)
					// Check if to path is not already existing and halt if it does
					if ( await FileFinder.exists( to ) )
						task.error(`File ${to} already exists`)
					// Target template file from crafter
					const templateFile = new File( from )
					await templateFile.load()
					// Template from path with properties and save it to path
					templateFile.template( vars )
					await templateFile.save( to )
					generatedSteps.push( to )
				}
				catch ( e ) {
					task.error(`Fatal error while executing step ${stepIndex - 1} on crafter "${action.id}".`)
					nicePrint( `{b/r}${e.stack}` )
					process.exit( 10 );
				}
			}
			const t = generatedSteps.length
			task.success(`${t} file${t > 1 ? 's' : ''} generated.`)
		})
	}
	await action.action( localCrafter, crafterRoot, appPath, env )
}

// ----------------------------------------------------------------------------- LOAD CREATE CRAFT ACTION

// Creat a craft action from within the crafter
export function createCraftAction ( id:string, menuEntry:string, action:TCraftActionFunction ) {
	if ( !global.__craftActions )
		nicePrint(`{b/r}Please use createCraftAction only in a crafter`, { code: 2 })
	if ( id in global.__craftActions )
		nicePrint(`{b/r}Craft action with id ${id} already exists`, { code: 3 })
	global.__craftActions[ id ] = { id, menuEntry, action } as ICraftActionItem
}