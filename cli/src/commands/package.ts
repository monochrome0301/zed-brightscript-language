import * as path from 'path';
import { buildOptionsFrom, loadBsConfig, CommonArgs, fileExists } from './common';
import { resolveBuildFields } from '../bsconfig';
import { buildProject } from './build';

/** `roku-zed package` — build a signed .pkg using signingPassword. */
export async function packageCmd(args: CommonArgs): Promise<void> {
    const info = loadBsConfig(args);
    const fields = resolveBuildFields(args.cwd, info.config, {
        outDir: args.outDir,
        outFile: args.outFile,
    });

    const signingPassword = info.config.signingPassword ?? args.password;
    if (!signingPassword) {
        throw new Error(
            'signing requires `signingPassword` in bsconfig.json (or pass --password). ' +
            'Without a password, use `roku-zed build` for an unsigned zip.'
        );
    }

    const { rokuDeploy } = require('roku-deploy');
    const outFileAbsolute = fields.outFile;

    if (info.filePath) {
        const result = await buildProject(
            { ...buildOptionsFrom(args), createPackage: true, outDir: fields.outDir, outFile: outFileAbsolute },
            info
        );
        if (result.errors > 0) {
            throw new Error(`package failed: ${result.errors} BrighterScript error(s)`);
        }
    } else {
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
    if (!fileExists(String(signedPkg))) {
        throw new Error(`signing completed but the .pkg is missing: ${signedPkg}`);
    }
    console.log(`Package OK: ${signedPkg}`);
}
