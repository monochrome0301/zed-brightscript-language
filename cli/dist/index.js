#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./commands/common");
const transpile_1 = require("./commands/transpile");
const buildcmd_1 = require("./commands/buildcmd");
const package_1 = require("./commands/package");
const sideload_1 = require("./commands/sideload");
const discover_1 = require("./commands/discover");
const logs_1 = require("./commands/logs");
const lint_1 = require("./commands/lint");
const types_1 = require("./commands/types");
const init_1 = require("./commands/init");
const key_1 = require("./commands/key");
const deeplink_1 = require("./commands/deeplink");
const HELP = `roku-zed — Roku build/deploy tooling for the Zed brightscript extension

Usage: roku-zed [--cwd <dir>] <command> [args] [flags]

Commands:
  transpile            transpile .bs -> .brs using bsconfig.json (no zip)
  build                transpile (when needed) + stage + zip into out/
  package              build a signed .pkg (needs signingPassword)
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
  --level <level>      log level filter for \`logs\` (all, error, errors, info, print)
`;
async function main() {
    const argv = process.argv.slice(2);
    const positionals = (0, common_1.positionalArgs)(argv);
    const command = positionals.shift() ?? '';
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        process.stdout.write(HELP);
        return 0;
    }
    let args;
    try {
        args = (0, common_1.parseCommonArgs)(argv);
    }
    catch (err) {
        console.error(String(err?.message ?? err));
        return 2;
    }
    try {
        switch (command) {
            case 'transpile':
                await (0, transpile_1.transpile)(args);
                break;
            case 'build':
                await (0, buildcmd_1.build)(args);
                break;
            case 'package':
                await (0, package_1.packageCmd)(args);
                break;
            case 'sideload':
                await (0, sideload_1.sideload)(args);
                break;
            case 'deploy':
                await (0, sideload_1.deploy)(args);
                break;
            case 'discover':
                await (0, discover_1.discover)(args);
                break;
            case 'logs':
                await (0, logs_1.logs)(args);
                break;
            case 'lint':
                await (0, lint_1.lint)(args);
                break;
            case 'types':
                await (0, types_1.types)(args);
                break;
            case 'init':
                await (0, init_1.init)(args);
                break;
            case 'key':
                await (0, key_1.key)(positionals, args);
                break;
            case 'deeplink':
                await (0, deeplink_1.deeplink)(positionals, args);
                break;
            default:
                console.error(`unknown command: ${command}\n`);
                process.stdout.write(HELP);
                return 2;
        }
        return 0;
    }
    catch (err) {
        console.error(`\n${command} failed: ${err?.message ?? err}`);
        if (err?.diagnostics) {
            console.error(JSON.stringify(err.diagnostics, null, 2));
        }
        return 1;
    }
}
main().then((code) => process.exit(code), (err) => {
    console.error(err);
    process.exit(1);
});
