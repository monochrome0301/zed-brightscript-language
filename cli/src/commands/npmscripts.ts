import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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
export function findNpmBuildScript(cwd: string): string | null {
    let pkg: { scripts?: Record<string, unknown> };
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    } catch {
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
export function delegateNpmBuild(cwd: string, command: 'build' | 'package'): boolean {
    const script = findNpmBuildScript(cwd);
    if (!script) {
        return false;
    }
    console.log(`Delegating \`${command}\` to the project's npm script: npm run ${script}\n`);
    // npm is npm.cmd on Windows: it cannot be spawned directly (EINVAL since
    // Node 18.20), so the whole line goes through the shell instead.
    const result =
        process.platform === 'win32'
            ? spawnSync(`npm run ${script}`, { cwd, stdio: 'inherit', shell: true })
            : spawnSync('npm', ['run', script], { cwd, stdio: 'inherit' });
    if (result.error) {
        throw new Error(`failed to run \`npm run ${script}\`: ${result.error.message}`);
    }
    if (result.status !== 0) {
        throw new Error(`npm run ${script} failed with exit code ${result.status ?? 'signal'}`);
    }
    return true;
}
