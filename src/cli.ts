#!/usr/bin/env node

import * as path from "path";
import { loadCrafter } from "./crafter";
import { nicePrint } from "@zouloux/cli";

if ( process.argv.length < 4  ) {
	nicePrint(`
		{b/r}Invalid usage of craft
		{d}Usage 1 : {b/w}craft ./path/to-crafter.js ./src/to-app/
		{d}Usage 2 : {b/w}craft ./path/to-crafter.js ./src/to-app/ action-id-to-exec
	`, {
		code: 1,
	})
}

const crafterPath = path.join( process.cwd(), process.argv[2] )
const appPath = path.join( process.cwd(), process.argv[3] )
loadCrafter( crafterPath, appPath, process.argv[4] ? process.argv[4] : null )
