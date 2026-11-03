"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.lint = lint;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("./common");
/**
 * `roku-zed lint` — run @rokucommunity/bslint diagnostics when the project
 * has it installed (as a devDependency or via bsconfig plugins).
 *
 * bslint is a BrighterScript plugin: we load it the same way BrighterScript
 * would (resolving `bslint` from the project) and run a program build with
 * `createPackage: false`, then report the plugin diagnostics.
 */
async function lint(args) {
    const info = (0, common_1.loadBsConfig)(args);
    const bslintPath = resolveBslint(args.cwd, info.config);
    if (!bslintPath) {
        throw new Error('bslint is not configured. Install it in the project (`npm install --save-dev @rokucommunity/bslint`) ' +
            'and add `"bslint"` to `plugins` in bsconfig.json — or add the plugin path directly.');
    }
    // bslint registers itself as a BrighterScript plugin when required.
    require(bslintPath);
    const { ProgramBuilder } = require('brighterscript');
    const builder = new ProgramBuilder();
    await builder.run({
        ...info.config,
        cwd: args.cwd,
        rootDir: require('path').resolve(args.cwd, info.config.rootDir ?? '.'),
        stagingDir: require('path').resolve(args.cwd, info.config.stagingDir ?? '.roku-deploy-staging'),
        createPackage: false,
        watch: false,
        retainStagingDir: true,
    });
    const diagnostics = builder.program?.getDiagnostics() ?? [];
    const errors = diagnostics.filter((d) => d.severity === 1 || d.severity === undefined);
    const warnings = diagnostics.filter((d) => d.severity === 2);
    const infos = diagnostics.filter((d) => d.severity === 3);
    for (const d of diagnostics) {
        const file = d.file?.path?.srcPath ?? d.file?.srcPath ?? '<unknown>';
        const range = d.range?.start
            ? `${d.range.start.line + 1}:${d.range.start.character + 1}`
            : '';
        console.log(`${d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : 'info'}: ${file}${range ? `:${range}` : ''} ${d.code ?? ''} ${d.message}`);
    }
    console.log(`\nbslint: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info`);
    if (errors.length > 0) {
        process.exitCode = 1;
    }
}
function resolveBslint(cwd, config) {
    const plugins = Array.isArray(config.plugins) ? config.plugins.map(String) : [];
    const candidates = [
        ...plugins.filter((p) => p.includes('bslint')),
        'bslint',
        '@rokucommunity/bslint',
    ];
    for (const candidate of candidates) {
        try {
            return require.resolve(candidate, { paths: [cwd] });
        }
        catch {
            // keep looking
        }
    }
    // also check a plugins/ directory at the project root (bslint.ts convention)
    for (const name of ['bslint.ts', 'bslint.js']) {
        const p = path.resolve(cwd, 'plugins', name);
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
}
