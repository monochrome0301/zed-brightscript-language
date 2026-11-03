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
exports.findBsConfig = findBsConfig;
exports.resolveBuildFields = resolveBuildFields;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function findBsConfig(cwd, explicitPath) {
    const candidates = [
        explicitPath,
        'bsconfig.json',
        'bsconfig.ls.json',
        'brsconfig.json',
    ].filter((p) => !!p);
    for (const candidate of candidates) {
        const filePath = path.resolve(cwd, candidate);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            return { filePath, config: parseConfigFile(filePath), isBrighterScript: true };
        }
    }
    return { filePath: null, config: {}, isBrighterScript: false };
}
function parseConfigFile(filePath) {
    let text;
    try {
        text = fs.readFileSync(filePath, 'utf8');
    }
    catch (err) {
        throw new Error(`Cannot read ${filePath}: ${err?.message ?? err}`);
    }
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('top-level value must be an object');
        }
        return parsed;
    }
    catch (err) {
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
        throw new Error(`Invalid bsconfig.json at ${filePath}${location}: ${err?.message ?? err}`);
    }
}
function resolveBuildFields(cwd, config, overrides) {
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
function stripUndefined(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
