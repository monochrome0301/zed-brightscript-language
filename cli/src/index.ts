#!/usr/bin/env node
import { parseCommonArgs, positionalArgs, CommonArgs } from './commands/common';
import { transpile } from './commands/transpile';
import { build } from './commands/buildcmd';
import { packageCmd } from './commands/package';
import { sideload, deploy } from './commands/sideload';
import { discover } from './commands/discover';
import { logs } from './commands/logs';
import { lint } from './commands/lint';
import { types } from './commands/types';
import { init } from './commands/init';
import { key } from './commands/key';
import { deeplink } from './commands/deeplink';

const HELP = `roku-zed — Roku build/deploy tooling for the Zed brightscript extension

Usage: roku-zed [--cwd <dir>] <command> [args] [flags]

Commands:
  transpile            transpile .bs -> .brs using bsconfig.json (no zip)
  build                transpile (when needed) + stage + zip into out/
                       (delegates to the project's npm build script when one exists)
  package              build a signed .pkg (needs signingPassword)
                       (delegates to the project's npm build script when one exists)
  sideload             deploy the built zip to a device and launch it
  deploy               build + sideload
  discover             list Roku devices on the network (SSDP/ECP)
  logs [--once]        stream device console logs (bounded capture with --once)
  lint                 run @rokucommunity/bslint when configured
  types                install/update roku-types (.d.bs completions)
  init                 generate .zed/tasks.json, .zed/debug.json, .zed/settings.json
  key <key>            send a remote-control keypress via ECP
  deeplink <url>       launch a deeplink via ECP

Common flags:
  --cwd <dir>          project directory (default: current directory)
  --host <ip[:port]>   target Roku device (or ROKU_DEVICE_IP env var)
  --password <pw>      developer password (or ROKU_DEV_PASSWORD / devPassword)
  --out-dir <dir>      override outDir
  --out-file <name>    override outFile
  --bsconfig <path>    explicit bsconfig.json path
  --no-npm             skip npm-script delegation; force the builtin pipeline
  --level <level>      log level filter for \`logs\` (all, error, errors, info, print)
`;

async function main(): Promise<number> {
    const argv = process.argv.slice(2);
    const positionals = positionalArgs(argv);
    const command = positionals.shift() ?? '';
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        process.stdout.write(HELP);
        return 0;
    }

    let args: CommonArgs;
    try {
        args = parseCommonArgs(argv);
    } catch (err: any) {
        console.error(String(err?.message ?? err));
        return 2;
    }

    try {
        switch (command) {
            case 'transpile':
                await transpile(args);
                break;
            case 'build':
                await build(args);
                break;
            case 'package':
                await packageCmd(args);
                break;
            case 'sideload':
                await sideload(args);
                break;
            case 'deploy':
                await deploy(args);
                break;
            case 'discover':
                await discover(args);
                break;
            case 'logs':
                await logs(args);
                break;
            case 'lint':
                await lint(args);
                break;
            case 'types':
                await types(args);
                break;
            case 'init':
                await init(args);
                break;
            case 'key':
                await key(positionals, args);
                break;
            case 'deeplink':
                await deeplink(positionals, args);
                break;
            default:
                console.error(`unknown command: ${command}\n`);
                process.stdout.write(HELP);
                return 2;
        }
        return 0;
    } catch (err: any) {
        console.error(`\n${command} failed: ${err?.message ?? err}`);
        if (err?.diagnostics) {
            console.error(JSON.stringify(err.diagnostics, null, 2));
        }
        return 1;
    }
}

main().then(
    (code) => process.exit(code),
    (err) => {
        console.error(err);
        process.exit(1);
    }
);
