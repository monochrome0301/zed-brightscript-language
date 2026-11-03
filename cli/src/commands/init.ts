import * as fs from 'fs';
import * as path from 'path';
import { CommonArgs, loadBsConfig } from './common';

/**
 * `roku-zed init` — generate the Zed project files:
 *   .zed/tasks.json     — roku: transpile/build/package/sideload/deploy/lint/logs tasks
 *   .zed/debug.json     — DAP scenario for roku-debug with sourceMaps enabled
 *   .zed/settings.json  — BrighterScript LSP settings
 * and a minimal bsconfig.json when the project doesn't have one.
 */
export async function init(args: CommonArgs): Promise<void> {
    const zedDir = path.join(args.cwd, '.zed');
    fs.mkdirSync(zedDir, { recursive: true });

    const created: string[] = [];
    const updated: string[] = [];

    const tasksJson = buildTasksJson();
    const debugJson = buildDebugJson();
    const settingsJson = buildSettingsJson();

    writeJson(path.join(zedDir, 'tasks.json'), tasksJson, created, updated);
    writeJson(path.join(zedDir, 'debug.json'), debugJson, created, updated);
    writeJson(path.join(zedDir, 'settings.json'), settingsJson, created, updated);

    const info = loadBsConfig(args);
    if (!info.filePath) {
        const bsconfig = {
            rootDir: 'source',
            files: [
                'manifest',
                'source/**/*',
                'components/**/*',
            ],
            stagingDir: '.roku-deploy-staging',
            outDir: 'out',
            outFile: 'package.zip',
            createPackage: true,
            sourceMap: true,
            autoImportComponentScript: true,
        };
        fs.writeFileSync(path.join(args.cwd, 'bsconfig.json'), JSON.stringify(bsconfig, null, 4) + '\n');
        created.push('bsconfig.json');
    }

    if (created.length > 0) {
        console.log(`created: ${created.join(', ')}`);
    }
    if (updated.length > 0) {
        console.log(`kept existing: ${updated.join(', ')}`);
    }
    console.log('\nNext steps:');
    console.log('  - run /roku-discover in Zed to find your device');
    console.log('  - set ROKU_DEV_PASSWORD (or devPassword in bsconfig.json) for sideloading');
    console.log('  - the "roku: logs" task streams device logs in a Zed terminal');
}

function writeJson(filePath: string, value: unknown, created: string[], updated: string[]): void {
    if (fs.existsSync(filePath)) {
        updated.push(path.basename(path.dirname(filePath)) + '/' + path.basename(filePath));
        return;
    }
    fs.writeFileSync(filePath, JSON.stringify(value, null, 4) + '\n');
    created.push('.zed/' + path.basename(filePath));
}

function buildTasksJson(): unknown {
    const roku = 'roku-zed';
    const make = (label: string, args: string[]): unknown => ({
        label: `roku: ${label}`,
        command: roku,
        args,
        cwd: '$ZED_WORKTREE_ROOT',
        use_new_terminal: false,
        allow_concurrent_runs: false,
        reveal: 'always',
    });
    return {
        tasks: [
            make('transpile', ['transpile']),
            make('build', ['build']),
            make('package', ['package']),
            make('sideload', ['sideload']),
            make('deploy', ['deploy']),
            make('lint', ['lint']),
            make('logs', ['logs']),
            make('types', ['types']),
        ],
    };
}

function buildDebugJson(): unknown {
    return {
        // roku-debug (see docs/DEBUGGING.md): the adapter binary is resolved
        // through node_modules; sourceMaps make breakpoints bind to .bs files.
        scenarios: [
            {
                label: 'Debug on Roku (brighterscript)',
                adapter: 'roku-debug',
                transport: 'stdio',
                request: 'launch',
                config: {
                    host: '$ROKU_DEVICE_IP',
                    password: '$ROKU_DEV_PASSWORD',
                    rootDir: '$ZED_WORKTREE_ROOT',
                    outDir: '$ZED_WORKTREE_ROOT/out',
                    sourceMaps: true,
                    enableDebugProtocol: true,
                    injectRaleTrackerEvent: false,
                },
            },
        ],
    };
}

function buildSettingsJson(): unknown {
    return {
        // Enable the BrighterScript language server for this project and
        // keep .bs formatting/diagnostics on.
        languages: {
            'BrighterScript': {
                language_servers: ['brighterscript'],
                format_on_save: 'on',
            },
            'BrightScript': {
                language_servers: ['brighterscript'],
                format_on_save: 'on',
            },
        },
    };
}
