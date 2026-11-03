"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpile = transpile;
const common_1 = require("./common");
const build_1 = require("./build");
/** `roku-zed transpile` — .bs -> .brs into the staging dir, no zip. */
async function transpile(args) {
    const info = (0, common_1.loadBsConfig)(args);
    if (!info.filePath) {
        console.log('No bsconfig.json found — nothing to transpile (plain BrightScript project).');
        return;
    }
    const result = await (0, build_1.buildProject)((0, common_1.buildOptionsFrom)(args), info);
    if (result.errors > 0) {
        throw new Error(`transpile finished with ${result.errors} error(s) and ${result.warnings} warning(s)`);
    }
    console.log(`Transpile OK: 0 errors, ${result.warnings} warning(s).`);
}
