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
exports.init = init;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("./common");
/**
 * `roku-zed init` — generate the Zed project files:
 *   .zed/tasks.json     — roku: transpile/build/package/sideload/deploy/lint/logs tasks
 *   .zed/debug.json     — DAP scenario for roku-debug with sourceMaps enabled
 *   .zed/settings.json  — BrighterScript LSP settings
 * and a minimal bsconfig.json when the project doesn't have one.
 */
async function init(args) {
    const zedDir = path.join(args.cwd, '.zed');
    fs.mkdirSync(zedDir, { recursive: true });
    const created = [];
    const updated = [];
    const tasksJson = buildTasksJson();
    const debugJson = buildDebugJson();
    const settingsJson = buildSettingsJson();
    writeJson(path.join(zedDir, 'tasks.json'), tasksJson, created, updated);
    writeJson(path.join(zedDir, 'debug.json'), debugJson, created, updated);
    writeJson(path.join(zedDir, 'settings.json'), settingsJson, created, updated);
    const info = (0, common_1.loadBsConfig)(args);
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
function writeJson(filePath, value, created, updated) {
    if (fs.existsSync(filePath)) {
        updated.push(path.basename(path.dirname(filePath)) + '/' + path.basename(filePath));
        return;
    }
    fs.writeFileSync(filePath, JSON.stringify(value, null, 4) + '\n');
    created.push('.zed/' + path.basename(filePath));
}
function buildTasksJson() {
    const roku = 'roku-zed';
    const make = (label, args) => ({
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
function buildDebugJson() {
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
function buildSettingsJson() {
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
