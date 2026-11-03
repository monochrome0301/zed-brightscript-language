import * as path from 'path';
import { buildProject, BuildOptions } from './build';
import { buildOptionsFrom, loadBsConfig, CommonArgs } from './common';
import { resolveBuildFields } from '../bsconfig';

/**
 * `roku-zed sideload` — transpile + zip the project (BrighterScript pipeline
 * so the uploaded zip contains only .brs) and upload, install and launch it
 * on the device via roku-deploy.
 */
export async function sideload(args: CommonArgs): Promise<void> {
    const info = loadBsConfig(args);
    const { host, username, password } = deviceCredentials(args, info);
    if (!password) {
        throw new Error(
            `no developer password for ${host}. Pass --password or set devPassword in bsconfig.json`
        );
    }

    const { rokuDeploy } = require('roku-deploy');
    const fields = resolveBuildFields(args.cwd, info.config, {
        outDir: args.outDir,
        outFile: args.outFile,
    });

    if (info.filePath) {
        const options: BuildOptions = {
            ...buildOptionsFrom(args),
            createPackage: true,
            outDir: fields.outDir,
            outFile: path.basename(fields.outFile),
        };
        const result = await buildProject(options, info);
        if (result.errors > 0) {
            throw new Error(`sideload failed: ${result.errors} BrighterScript error(s)`);
        }
    } else {
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
export async function deploy(args: CommonArgs): Promise<void> {
    return sideload(args);
}

function deviceCredentials(args: CommonArgs, info: { config: Record<string, any> }): { host: string; username: string; password: string } {
    const host = args.host ?? process.env.ROKU_DEVICE_IP ?? info.config.host;
    if (!host) {
        throw new Error(
            'No device host given. Pass `--host 192.168.1.100`, set ROKU_DEVICE_IP, or set host in bsconfig.json. Run `roku-zed discover` to find devices.'
        );
    }
    return {
        host: String(host),
        username: String(args.username ?? info.config.devUsername ?? 'rokudev'),
        password: String(args.password ?? info.config.devPassword ?? process.env.ROKU_DEV_PASSWORD ?? ''),
    };
}
