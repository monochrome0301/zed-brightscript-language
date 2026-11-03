import * as fs from 'fs';
import * as path from 'path';

/**
 * Locates, parses and validates the project's bsconfig.json.
 *
 * The actual extends-chain resolution is done by BrighterScript itself when
 * the program is built; here we only read the fields the CLI needs and
 * surface actionable errors (file + JSON position) instead of failing
 * generically.
 */
export interface BsConfigInfo {
    /** Absolute path of the bsconfig.json that was found (or null). */
    filePath: string | null;
    /** Parsed config (empty object when no bsconfig.json exists). */
    config: Record<string, any>;
    /** True when the project is BrighterScript-based (has a bsconfig.json). */
    isBrighterScript: boolean;
}

export function findBsConfig(cwd: string, explicitPath?: string): BsConfigInfo {
    const candidates = [
        explicitPath,
        'bsconfig.json',
        'bsconfig.ls.json',
        'brsconfig.json',
    ].filter((p): p is string => !!p);

    for (const candidate of candidates) {
        const filePath = path.resolve(cwd, candidate);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return { filePath, config: parseConfigFile(filePath), isBrighterScript: true };
        }
    }
    return { filePath: null, config: {}, isBrighterScript: false };
}

function parseConfigFile(filePath: string): Record<string, any> {
    let text: string;
    try {
        text = fs.readFileSync(filePath, 'utf8');
    } catch (err: any) {
        throw new Error(`Cannot read ${filePath}: ${err?.message ?? err}`);
    }

    try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('top-level value must be an object');
        }
        return parsed;
    } catch (err: any) {
        // JSON.parse errors carry a position in the message: "at position N".
        const position = /position (\d+)/.exec(err?.message ?? '');
        let location = '';
        if (position) {
            const offset = Number(position[1]);
            const upto = text.slice(0, offset);
            const line = upto.split('\n').length;
            const column = offset - upto.lastIndexOf('\n');
            location = ` (line ${line}, column ${column})`;
        }
        throw new Error(
            `Invalid bsconfig.json at ${filePath}${location}: ${err?.message ?? err}`
        );
    }
}

/** Fields of bsconfig.json relevant to the CLI. */
export interface ResolvedBuildFields {
    rootDir: string;
    stagingDir: string;
    outFile: string;
    outDir: string;
    createPackage: boolean;
    plugins: string[];
}

export function resolveBuildFields(cwd: string, config: Record<string, any>, overrides: Record<string, any>): ResolvedBuildFields {
    const merged = { ...config, ...stripUndefined(overrides) };
    const rootDir = path.resolve(cwd, merged.rootDir ?? 'source');
    const stagingDir = path.resolve(cwd, merged.stagingDir ?? '.roku-deploy-staging');
    const outDir = path.resolve(cwd, merged.outDir ?? 'out');
    const outFile = path.resolve(outDir, merged.outFile ?? 'package.zip');
    return {
        rootDir,
        stagingDir,
        outFile,
        outDir,
        createPackage: merged.createPackage !== false,
        plugins: Array.isArray(merged.plugins) ? merged.plugins.map(String) : [],
    };
}

function stripUndefined(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
