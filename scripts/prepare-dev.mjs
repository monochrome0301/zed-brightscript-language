#!/usr/bin/env node
/**
 * Prepares the vendored tree-sitter grammars for local development with
 * Zed's "Install Dev Extension" flow.
 *
 * Zed fetches extension grammars with `git fetch <repository> <rev>`, which
 * requires a real git repository at an absolute `file://` URL — a plain
 * subdirectory of this repo will not work. This script:
 *
 *   1. copies each vendored grammar into `target/grammar-repos/<name>`,
 *   2. turns that copy into a standalone git repository (init + commit),
 *   3. rewrites the `[grammars.*]` entries in `extension.toml` to point at
 *      the copy's absolute `file://` URL and commit SHA.
 *
 * Re-run it whenever a grammar changes, then use
 * `Extensions > Install Dev Extension` in Zed pointing at this directory.
 *
 * For publishing, replace the `file://` URLs with the public GitHub URLs of
 * the grammar repositories (see docs/GRAMMARS.md).
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'extension.toml');
const grammarDirs = {
  brightscript: 'grammars/tree-sitter-brightscript',
  brighterscript: 'grammars/tree-sitter-brighterscript',
  roku_xml: 'grammars/tree-sitter-roku-xml',
};

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

function main() {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  for (const [name, rel] of Object.entries(grammarDirs)) {
    const src = path.join(root, rel);
    const dest = path.join(root, 'target', 'grammar-repos', name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });

    git(dest, ['init', '-q']);
    git(dest, ['add', '-A']);
    git(dest, ['commit', '-q', '--allow-empty', '-m', `grammar snapshot: ${name}`]);

    const rev = git(dest, ['rev-parse', 'HEAD']);
    const url = String(pathToFileURL(dest));

    manifest = manifest.replace(
      new RegExp(
        `(\\[grammars\\.${name}\\]\\s*repository\\s*=\\s*)"[^"]*"(\\s*rev\\s*=\\s*)"[^"]*"`,
      ),
      `$1"${url}"$2"${rev}"`,
    );
    console.log(`prepared ${name} -> ${url} @ ${rev.slice(0, 12)}`);
  }

  fs.writeFileSync(manifestPath, manifest);
  console.log('\nextension.toml updated. Now install the dev extension in Zed:');
  console.log('  Extensions > Install Dev Extension > select this directory');
}

main();
