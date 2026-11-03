import * as net from 'net';
import { resolveHost } from '../ecp';
import { CommonArgs } from './common';

/**
 * `roku-zed logs` — device console logs.
 *
 * Newer Roku OS builds expose the developer console over TCP 8085 (the
 * rendezvous/debug port used by roku-debug); classic builds keep the telnet
 * console on 8080. We try 8085 first and fall back to 8080.
 *
 * With `--once` (used by the /roku-logs slash command) we capture output for
 * a bounded time and exit; without it we stream until interrupted (use this
 * from the generated `roku: logs` terminal task).
 */
export async function logs(args: CommonArgs): Promise<void> {
    const host = resolveHost(args.host ?? process.env.ROKU_DEVICE_IP);
    const level = (args.level ?? 'all').toLowerCase();
    const once = args.once ?? false;
    const captureMs = 8000;

    const ports = [8085, 8080];
    for (const port of ports) {
        try {
            await streamLogs(host, port, { once, level, captureMs });
            return;
        } catch (err: any) {
            if (port === ports[ports.length - 1]) {
                throw new Error(
                    `could not read device logs from ${host} (tried ports ${ports.join(', ')}): ${err?.message ?? err}`
                );
            }
            // try the next port
        }
    }
}

function streamLogs(
    host: string,
    port: number,
    options: { once: boolean; level: string; captureMs: number }
): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = net.connect({ host: host.split(':')[0], port });
        let opened = false;

        socket.setTimeout(5000, () => {
            socket.destroy();
            if (!opened) {
                reject(new Error('connection timeout'));
            }
        });
        socket.on('error', (err) => {
            if (!opened) {
                reject(err);
            }
        });
        socket.on('connect', () => {
            opened = true;
            console.error(`-- connected to ${host}:${port} (press Ctrl+C to stop) --`);
            if (options.once) {
                setTimeout(() => {
                    socket.destroy();
                    resolve();
                }, options.captureMs);
            }
        });
        socket.on('data', (data: Buffer) => {
            const text = data.toString();
            for (const line of text.split('\n')) {
                if (matchesLevel(line, options.level)) {
                    process.stdout.write(line + '\n');
                }
            }
        });
        socket.on('close', () => {
            if (opened) {
                resolve();
            }
        });
        socket.on('end', () => resolve());
    });
}

const LEVEL_PREFIXES = ['error', 'warning', 'info', 'debug', 'trace', 'print'];

function matchesLevel(line: string, level: string): boolean {
    if (level === 'all' || level === '') {
        return true;
    }
    if (level === 'errors') {
        return /^(\s*\[?error|\berror\b)/i.test(line) || /\*\*ERROR\*\*/i.test(line);
    }
    const wanted = LEVEL_PREFIXES.includes(level) ? [level] : [level];
    return wanted.some((l) => line.toLowerCase().includes(l));
}
