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
exports.packageCmd = packageCmd;
const path = __importStar(require("path"));
const common_1 = require("./common");
const bsconfig_1 = require("../bsconfig");
const build_1 = require("./build");
/** `roku-zed package` — build a signed .pkg using signingPassword. */
async function packageCmd(args) {
    const info = (0, common_1.loadBsConfig)(args);
    const fields = (0, bsconfig_1.resolveBuildFields)(args.cwd, info.config, {
        outDir: args.outDir,
        outFile: args.outFile,
    });
    const signingPassword = info.config.signingPassword ?? args.password;
    if (!signingPassword) {
        throw new Error('signing requires `signingPassword` in bsconfig.json (or pass --password). ' +
            'Without a password, use `roku-zed build` for an unsigned zip.');
    }
    const { rokuDeploy } = require('roku-deploy');
    const outFileAbsolute = fields.outFile;
    if (info.filePath) {
        const result = await (0, build_1.buildProject)({ ...(0, common_1.buildOptionsFrom)(args), createPackage: true, outDir: fields.outDir, outFile: outFileAbsolute }, info);
        if (result.errors > 0) {
            throw new Error(`package failed: ${result.errors} BrighterScript error(s)`);
        }
    }
    else {
        await rokuDeploy.createPackage({
            rootDir: path.resolve(args.cwd, info.config.rootDir ?? 'source'),
            outDir: fields.outDir,
            outFile: outFileAbsolute,
        });
    }
    const options = {
        host: args.host ?? process.env.ROKU_DEVICE_IP,
        password: signingPassword,
    };
    await rokuDeploy.rekeyDevice(options);
    const pkgPath = await rokuDeploy.signExistingPackage(options);
    const signedPkg = await rokuDeploy.retrieveSignedPackage(pkgPath, options);
    if (!(0, common_1.fileExists)(String(signedPkg))) {
        throw new Error(`signing completed but the .pkg is missing: ${signedPkg}`);
    }
    console.log(`Package OK: ${signedPkg}`);
}
