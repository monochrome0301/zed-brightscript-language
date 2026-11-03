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
exports.positionalArgs = positionalArgs;
exports.parseCommonArgs = parseCommonArgs;
exports.buildOptionsFrom = buildOptionsFrom;
exports.loadBsConfig = loadBsConfig;
exports.requireHost = requireHost;
exports.readDeviceCredentials = readDeviceCredentials;
exports.fileExists = fileExists;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bsconfig_1 = require("../bsconfig");
const ecp_1 = require("../ecp");
const FLAGS_WITH_VALUES = new Set([
    '--cwd', '--host', '--username', '--password', '--out-dir', '--out-file', '--bsconfig', '--level',
]);
/** Positions of true positional arguments (not flags and not flag values). */
function positionalArgs(argv) {
    const values = [];
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
function parseCommonArgs(argv) {
    const args = { cwd: process.cwd() };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = () => {
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
            default:
                break;
        }
    }
    return args;
}
function buildOptionsFrom(args) {
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
function loadBsConfig(args) {
    const info = (0, bsconfig_1.findBsConfig)(args.cwd, args.bsconfig);
    if (info.filePath) {
        // force validation now so users get line/column errors up front
        (0, bsconfig_1.resolveBuildFields)(args.cwd, info.config, {});
    }
    return info;
}
/** Fills roku-deploy host/credentials from args or the device page config. */
function requireHost(args) {
    const host = args.host ?? process.env.ROKU_DEVICE_IP;
    return (0, ecp_1.resolveHost)(host);
}
function readDeviceCredentials(args, info) {
    const host = requireHost(args);
    const merged = { ...info.config, ...(args.username ? { devUsername: args.username } : {}), ...(args.password ? { devPassword: args.password } : {}) };
    return {
        host,
        username: String(merged.devUsername ?? 'rokudev'),
        password: String(merged.devPassword ?? ''),
    };
}
function fileExists(p) {
    try {
        return fs.statSync(p).isFile();
    }
    catch {
        return false;
    }
}
