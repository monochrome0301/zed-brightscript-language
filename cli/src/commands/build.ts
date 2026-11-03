import * as path from 'path';
import { ProgramBuilder } from 'brighterscript';
import { BsConfigInfo } from '../bsconfig';

export interface BuildOptions {
    cwd: string;
    createPackage: boolean;
    outDir?: string;
    outFile?: string;
    host?: string;
    username?: string;
    password?: string;
    failOnCompileError?: boolean;
}

/**
 * Runs the BrighterScript program builder: reads bsconfig.json (BrighterScript
 * handles its own extends chain, plugins, files/excludeFiles and diagnostics),
 * transpiles .bs/.brs into the staging dir and optionally zips it via
 * roku-deploy.
 */
export async function buildProject(options: BuildOptions, info: BsConfigInfo): Promise<{ errors: number; warnings: number }> {
    const builder = new ProgramBuilder();
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
    } as any);

    const diagnostics: any[] = builder.program?.getDiagnostics() ?? [];
    const errors = diagnostics.filter((d) => d.severity === 1 || d.severity === undefined).length;
    const warnings = diagnostics.filter((d) => d.severity === 2).length;
    return { errors, warnings };
}
