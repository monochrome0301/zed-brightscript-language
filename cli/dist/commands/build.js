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
exports.buildProject = buildProject;
const path = __importStar(require("path"));
const brighterscript_1 = require("brighterscript");
/**
 * Runs the BrighterScript program builder: reads bsconfig.json (BrighterScript
 * handles its own extends chain, plugins, files/excludeFiles and diagnostics),
 * transpiles .bs/.brs into the staging dir and optionally zips it via
 * roku-deploy.
 */
async function buildProject(options, info) {
    const builder = new brighterscript_1.ProgramBuilder();
    await builder.run({
        ...info.config,
        cwd: options.cwd,
        rootDir: path.resolve(options.cwd, info.config.rootDir ?? '.'),
        stagingDir: path.resolve(options.cwd, info.config.stagingDir ?? '.roku-deploy-staging'),
        // an absolute outFile makes BrighterScript derive outDir from it
        outFile: options.outFile
            ? path.resolve(options.cwd, options.outFile)
            : path.resolve(options.cwd, info.config.outFile ?? 'out/package.zip'),
        createPackage: options.createPackage,
        watch: false,
        retainStagingDir: info.config.retainStagingDir ?? true,
    });
    const diagnostics = builder.program?.getDiagnostics() ?? [];
    const errors = diagnostics.filter((d) => d.severity === 1 || d.severity === undefined).length;
    const warnings = diagnostics.filter((d) => d.severity === 2).length;
    return { errors, warnings };
}
