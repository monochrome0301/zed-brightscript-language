'use strict';
/**
 * CLI smoke tests: build both example projects and assert the output zips.
 * Run with `npm test` inside cli/ (after `npm run build`).
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const cli = path.join(root, 'cli', 'dist', 'index.js');

let failures = 0;

function run(args) {
    execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: 'inherit' });
}

function assert(condition, message) {
    if (condition) {
        console.log(`  ok: ${message}`);
    } else {
        failures += 1;
        console.error(`  FAIL: ${message}`);
    }
}

function listZip(zipPath) {
    // cross-platform: python's zipfile (available on CI runners)
    const out = execFileSync('python', ['-I', path.join(__dirname, 'zipnames.py'), zipPath], { encoding: 'utf8' });
    return out.split('\n').map((line) => line.replace(/\r$/, '')).filter(Boolean);
}

console.log('example: brighterscript-advanced — transpile');
run(['--cwd', 'examples/brighterscript-advanced', 'transpile']);
const staging = path.join(root, 'examples/brighterscript-advanced/.roku-deploy-staging');
assert(fs.existsSync(path.join(staging, 'source/main.brs')), 'main.bs was transpiled to main.brs');
assert(!fs.existsSync(path.join(staging, 'source/main.bs')), 'no .bs left in staging');

console.log('example: brighterscript-advanced — build');
run(['--cwd', 'examples/brighterscript-advanced', 'build']);
const bsZip = path.join(root, 'examples/brighterscript-advanced/out/package.zip');
assert(fs.existsSync(bsZip), 'package.zip created');
const bsEntries = listZip(bsZip);
assert(bsEntries.includes('source/main.brs'), 'zip contains transpiled main.brs');
assert(!bsEntries.some((e) => e.toLowerCase().endsWith('.bs')), 'zip contains no .bs files');
assert(bsEntries.includes('source/main.brs.map'), 'zip contains source maps for debugging');

console.log('example: brightscript-basic — build');
run(['--cwd', 'examples/brightscript-basic', 'build']);
const brsZip = path.join(root, 'examples/brightscript-basic/out/package.zip');
assert(fs.existsSync(brsZip), 'package.zip created');
const brsEntries = listZip(brsZip);
assert(brsEntries.includes('manifest'), 'zip contains manifest');
assert(brsEntries.includes('source/main.brs'), 'zip contains main.brs');

console.log('cli: invalid bsconfig fails with position info');
let stderr = '';
try {
    execFileSync(process.execPath, [cli, '--cwd', 'examples/brighterscript-advanced', '--bsconfig', path.join(__dirname, 'fixtures/bad-bsconfig.json'), 'transpile'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
} catch (err) {
    stderr = String(err.stderr ?? '');
}
assert(stderr.includes('Invalid bsconfig.json') && /line \d+, column \d+/.test(stderr), 'bsconfig JSON errors report line and column');

console.log(failures === 0 ? '\nall CLI smoke tests passed' : `\n${failures} test(s) failed`);
process.exit(failures === 0 ? 0 : 1);
