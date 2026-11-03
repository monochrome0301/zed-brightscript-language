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
exports.build = build;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const build_1 = require("./build");
const common_1 = require("./common");
const npmscripts_1 = require("./npmscripts");
const bsconfig_1 = require("../bsconfig");
/** `roku-zed build` — transpile (when applicable) + stage + zip into out/. */
async function build(args) {
    // Projects with their own npm build chain (bs-plugins, monorepos) get the
    // exact same build their VS Code task runs; --no-npm forces the builtin.
    if (!args.noNpm && (0, npmscripts_1.delegateNpmBuild)(args.cwd, 'build')) {
        return;
    }
    const started = Date.now();
    const info = (0, common_1.loadBsConfig)(args);
    if (!info.filePath) {
        // Plain BrightScript project: stage + zip straight through roku-deploy.
        const { rokuDeploy } = require('roku-deploy');
        const outDir = path.resolve(args.cwd, args.outDir ?? info.config.outDir ?? 'out');
        const outFile = args.outFile ?? info.config.outFile ?? 'package.zip';
        await rokuDeploy.createPackage({
            rootDir: args.cwd,
            outDir,
            outFile,
            files: info.config.files ?? [
                'manifest',
                'source/**/*',
                'components/**/*',
                'images/**/*',
            ],
        });
        const zipPath = rokuDeploy.getOutputZipFilePath({ outDir, outFile });
        const size = fs.statSync(zipPath).size;
        console.log(`Build OK (BrightScript, no bsconfig.json): ${zipPath} (${(size / 1024).toFixed(1)} KB)`);
        return;
    }
    const fields = (0, bsconfig_1.resolveBuildFields)(args.cwd, info.config, {
        outDir: args.outDir,
        outFile: args.outFile,
    });
    const options = { ...(0, common_1.buildOptionsFrom)(args), createPackage: true, outDir: fields.outDir, outFile: fields.outFile };
    const result = await (0, build_1.buildProject)(options, info);
    if (result.errors > 0) {
        throw new Error(`build failed: ${result.errors} BrighterScript error(s) — see diagnostics above`);
    }
    const zipPath = fields.outFile;
    if (!(0, common_1.fileExists)(zipPath)) {
        throw new Error(`build finished without errors but the zip is missing: ${zipPath}`);
    }
    const size = fs.statSync(zipPath).size;
    // The zip must contain BrightScript only — verify no .bs survived.
    const staging = fields.stagingDir;
    const bsInStaging = stagingExists(staging) ? countBsFiles(staging) : 0;
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`Build OK: ${zipPath}`);
    console.log(`  size: ${(size / 1024).toFixed(1)} KB, duration: ${elapsed}s`);
    console.log(`  transpiled staging dir: ${staging}`);
    if (bsInStaging > 0) {
        throw new Error(`build produced a zip containing ${bsInStaging} .bs file(s); BrighterScript must never ship to the device — check files/excludeFiles in bsconfig.json`);
    }
}
function stagingExists(staging) {
    try {
        return fs.statSync(staging).isDirectory();
    }
    catch {
        return false;
    }
}
function countBsFiles(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += countBsFiles(full);
        }
        else if (entry.name.toLowerCase().endsWith('.bs')) {
            count += 1;
        }
    }
    return count;
}
