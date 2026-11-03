import * as fs from 'fs';
import * as path from 'path';
import { buildProject, BuildOptions } from './build';
import { findBsConfig, resolveBuildFields, BsConfigInfo } from '../bsconfig';
import { resolveHost } from '../ecp';

/** Options shared by every CLI subcommand, extracted from argv. */
export interface CommonArgs {
    cwd: string;
    host?: string;
    username?: string;
    password?: string;
    outDir?: string;
    outFile?: string;
    bsconfig?: string;
    once?: boolean;
    level?: string;
    /** Skip npm-script delegation and force the built-in pipeline. */
    noNpm?: boolean;
}

const FLAGS_WITH_VALUES = new Set([
    '--cwd', '--host', '--username', '--password', '--out-dir', '--out-file', '--bsconfig', '--level',
]);

/** Positions of true positional arguments (not flags and not flag values). */
export function positionalArgs(argv: string[]): string[] {
    const values: string[] = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (FLAGS_WITH_VALUES.has(arg)) {
            i += 1;
            continue;
        }
        if (!arg.startsWith('--')) {
            values.push(arg);
        }
    }
    return values;
}

export function parseCommonArgs(argv: string[]): CommonArgs {
    const args: CommonArgs = { cwd: process.cwd() };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = (): string => {
            if (i + 1 >= argv.length) {
                throw new Error(`flag ${arg} expects a value`);
            }
            return argv[++i];
        };
        switch (arg) {
            case '--cwd':
                args.cwd = path.resolve(next());
                break;
            case '--host':
                args.host = next();
                break;
            case '--username':
                args.username = next();
                break;
            case '--password':
                args.password = next();
                break;
            case '--out-dir':
                args.outDir = next();
                break;
            case '--out-file':
                args.outFile = next();
                break;
            case '--bsconfig':
                args.bsconfig = next();
                break;
            case '--once':
                args.once = true;
                break;
            case '--level':
                args.level = next();
                break;
            case '--no-npm':
                args.noNpm = true;
                break;
            default:
                break;
        }
    }
    return args;
}

export function buildOptionsFrom(args: CommonArgs): BuildOptions {
    return {
        cwd: args.cwd,
        createPackage: false,
        outDir: args.outDir,
        outFile: args.outFile,
        host: args.host,
        username: args.username,
        password: args.password,
    };
}

/** Loads bsconfig.json, throwing a clear error when it is malformed. */
export function loadBsConfig(args: CommonArgs): BsConfigInfo {
    const info = findBsConfig(args.cwd, args.bsconfig);
    if (info.filePath) {
        // force validation now so users get line/column errors up front
        resolveBuildFields(args.cwd, info.config, {});
    }
    return info;
}

/** Fills roku-deploy host/credentials from args or the device page config. */
export function requireHost(args: CommonArgs): string {
    const host = args.host ?? process.env.ROKU_DEVICE_IP;
    return resolveHost(host);
}

export function readDeviceCredentials(args: CommonArgs, info: BsConfigInfo): { host: string; password: string; username: string } {
    const host = requireHost(args);
    const merged: Record<string, any> = { ...info.config, ...(args.username ? { devUsername: args.username } : {}), ...(args.password ? { devPassword: args.password } : {}) };
    return {
        host,
        username: String(merged.devUsername ?? 'rokudev'),
        password: String(merged.devPassword ?? ''),
    };
}

export function fileExists(p: string): boolean {
    try {
        return fs.statSync(p).isFile();
    } catch {
        return false;
    }
}
