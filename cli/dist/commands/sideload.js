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
exports.sideload = sideload;
exports.deploy = deploy;
const path = __importStar(require("path"));
const build_1 = require("./build");
const common_1 = require("./common");
const bsconfig_1 = require("../bsconfig");
/**
 * `roku-zed sideload` — transpile + zip the project (BrighterScript pipeline
 * so the uploaded zip contains only .brs) and upload, install and launch it
 * on the device via roku-deploy.
 */
async function sideload(args) {
    const info = (0, common_1.loadBsConfig)(args);
    const { host, username, password } = deviceCredentials(args, info);
    if (!password) {
        throw new Error(`no developer password for ${host}. Pass --password or set devPassword in bsconfig.json`);
    }
    const { rokuDeploy } = require('roku-deploy');
    const fields = (0, bsconfig_1.resolveBuildFields)(args.cwd, info.config, {
        outDir: args.outDir,
        outFile: args.outFile,
    });
    if (info.filePath) {
        const options = {
            ...(0, common_1.buildOptionsFrom)(args),
            createPackage: true,
            outDir: fields.outDir,
            outFile: path.basename(fields.outFile),
        };
        const result = await (0, build_1.buildProject)(options, info);
        if (result.errors > 0) {
            throw new Error(`sideload failed: ${result.errors} BrighterScript error(s)`);
        }
    }
    else {
        await rokuDeploy.createPackage({
            rootDir: path.resolve(args.cwd, info.config.rootDir ?? 'source'),
            outDir: fields.outDir,
            outFile: path.basename(fields.outFile),
            files: info.config.files ?? ['manifest', 'source/**/*', 'components/**/*', 'images/**/*'],
        });
    }
    await rokuDeploy.publish({
        host,
        username,
        password,
        rootDir: fields.rootDir,
        outDir: fields.outDir,
        outFile: path.basename(fields.outFile),
        failOnCompileError: true,
    });
    await rokuDeploy.pressHomeButton(host);
    console.log(`Sideload OK: ${fields.outFile} deployed to ${host} and launched.`);
}
/** `roku-zed deploy` — build + sideload in one step (same pipeline). */
async function deploy(args) {
    return sideload(args);
}
function deviceCredentials(args, info) {
    const host = args.host ?? process.env.ROKU_DEVICE_IP ?? info.config.host;
    if (!host) {
        throw new Error('No device host given. Pass `--host 192.168.1.100`, set ROKU_DEVICE_IP, or set host in bsconfig.json. Run `roku-zed discover` to find devices.');
    }
    return {
        host: String(host),
        username: String(args.username ?? info.config.devUsername ?? 'rokudev'),
        password: String(args.password ?? info.config.devPassword ?? process.env.ROKU_DEV_PASSWORD ?? ''),
    };
}
