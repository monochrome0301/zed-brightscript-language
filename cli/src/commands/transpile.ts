import { buildOptionsFrom, loadBsConfig, CommonArgs } from './common';
import { buildProject } from './build';

/** `roku-zed transpile` — .bs -> .brs into the staging dir, no zip. */
export async function transpile(args: CommonArgs): Promise<void> {
    const info = loadBsConfig(args);
    if (!info.filePath) {
        console.log('No bsconfig.json found — nothing to transpile (plain BrightScript project).');
        return;
    }
    const result = await buildProject(buildOptionsFrom(args), info);
    if (result.errors > 0) {
        throw new Error(
            `transpile finished with ${result.errors} error(s) and ${result.warnings} warning(s)`
        );
    }
    console.log(`Transpile OK: 0 errors, ${result.warnings} warning(s).`);
}
