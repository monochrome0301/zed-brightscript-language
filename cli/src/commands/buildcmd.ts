import * as fs from 'fs';
import * as path from 'path';
import { buildProject, BuildOptions } from './build';
import { buildOptionsFrom, loadBsConfig, CommonArgs, fileExists } from './common';
import { resolveBuildFields } from '../bsconfig';

/** `roku-zed build` — transpile (when applicable) + stage + zip into out/. */
export async function build(args: CommonArgs): Promise<void> {
    const started = Date.now();
    const info = loadBsConfig(args);

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

    const fields = resolveBuildFields(args.cwd, info.config, {
        outDir: args.outDir,
        outFile: args.outFile,
    });
    const options: BuildOptions = { ...buildOptionsFrom(args), createPackage: true, outDir: fields.outDir, outFile: fields.outFile };
    const result = await buildProject(options, info);
    if (result.errors > 0) {
        throw new Error(`build failed: ${result.errors} BrighterScript error(s) — see diagnostics above`);
    }

    const zipPath = fields.outFile;
    if (!fileExists(zipPath)) {
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
        throw new Error(
            `build produced a zip containing ${bsInStaging} .bs file(s); BrighterScript must never ship to the device — check files/excludeFiles in bsconfig.json`
        );
    }
}

function stagingExists(staging: string): boolean {
    try {
        return fs.statSync(staging).isDirectory();
    } catch {
        return false;
    }
}

function countBsFiles(dir: string): number {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += countBsFiles(full);
        } else if (entry.name.toLowerCase().endsWith('.bs')) {
            count += 1;
        }
    }
    return count;
}
