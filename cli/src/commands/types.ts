import { execFileSync } from 'child_process';
import * as path from 'path';
import { CommonArgs } from './common';

/** `roku-zed types` — install or update `roku-types` in the project. */
export async function types(args: CommonArgs): Promise<void> {
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    try {
        const installed = require.resolve('roku-types/package.json', { paths: [args.cwd] });
        const version = JSON.parse(require('fs').readFileSync(installed, 'utf8')).version;
        console.log(`roku-types ${version} already installed at ${path.dirname(path.dirname(installed))}; updating…`);
    } catch {
        console.log('roku-types not found; installing…');
    }

    try {
        execFileSync(npmBin, ['install', '--save-dev', 'roku-types@latest'], {
            cwd: args.cwd,
            stdio: 'inherit',
        });
    } catch (err: any) {
        throw new Error(
            `failed to install roku-types: ${err?.message ?? err}. ` +
            'Run `npm install --save-dev roku-types` in the project root manually.'
        );
    }

    const resolved = require.resolve('roku-types/package.json', { paths: [args.cwd] });
    const version = JSON.parse(require('fs').readFileSync(resolved, 'utf8')).version;
    console.log(`\nroku-types ${version} ready.`);
    console.log('The BrighterScript LSP picks up the .d.bs definitions automatically; completions appear after the server reloads.');
}
