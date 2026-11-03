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
exports.findNpmBuildScript = findNpmBuildScript;
exports.delegateNpmBuild = delegateNpmBuild;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * npm script names tried in order when delegating a build/package.
 * `build:dev` first: Roku projects (e.g. playlet) define it as the full
 * dev chain (web + lib + app with their bs-plugins), which is what the
 * editor's default build task runs there.
 */
const BUILD_SCRIPT_PRIORITY = ['build:dev', 'build', 'build:prod'];
/**
 * Returns the npm build script to delegate to for the project at `cwd`,
 * or null when there is no package.json with a matching script.
 */
function findNpmBuildScript(cwd) {
    let pkg;
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    }
    catch {
        return null;
    }
    const scripts = pkg?.scripts ?? {};
    for (const name of BUILD_SCRIPT_PRIORITY) {
        const value = scripts[name];
        if (typeof value === 'string' && value.trim()) {
            return name;
        }
    }
    return null;
}
/**
 * Runs the project's own npm build script instead of the built-in
 * BrighterScript pipeline. This makes `roku-zed build`/`package` from Zed
 * reproduce exactly what the project's VS Code build task does (custom
 * bs-plugins, monorepo chains, postbuild steps...).
 *
 * Returns false when there is nothing to delegate to, so the caller falls
 * back to the built-in pipeline. Throws when the delegated script fails.
 */
function delegateNpmBuild(cwd, command) {
    const script = findNpmBuildScript(cwd);
    if (!script) {
        return false;
    }
    console.log(`Delegating \`${command}\` to the project's npm script: npm run ${script}\n`);
    // npm is npm.cmd on Windows: it cannot be spawned directly (EINVAL since
    // Node 18.20), so the whole line goes through the shell instead.
    const result = process.platform === 'win32'
        ? (0, child_process_1.spawnSync)(`npm run ${script}`, { cwd, stdio: 'inherit', shell: true })
        : (0, child_process_1.spawnSync)('npm', ['run', script], { cwd, stdio: 'inherit' });
    if (result.error) {
        throw new Error(`failed to run \`npm run ${script}\`: ${result.error.message}`);
    }
    if (result.status !== 0) {
        throw new Error(`npm run ${script} failed with exit code ${result.status ?? 'signal'}`);
    }
    return true;
}
