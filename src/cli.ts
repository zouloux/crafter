#!/usr/bin/env node

import * as path from "path";
import { loadCrafter } from "./crafter";
import { nicePrint } from "@zouloux/cli";

if ( process.argv.length >= 4 && process.argv[1].split("/.bin/craft").length !== 0 ) {
	const crafterPath = path.join( process.cwd(), process.argv[2] )
	const appPath = path.join( process.cwd(), process.argv[3] )
	loadCrafter( crafterPath, appPath )
}
else {
	nicePrint(`
		{b/r}Invalid usage of craft
		{d}Usage: {b/w}craft ./path/to-crafter.js ./src/to-app/
	`, {
		code: 1,
	})
}
