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
exports.logs = logs;
const net = __importStar(require("net"));
const ecp_1 = require("../ecp");
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
async function logs(args) {
    const host = (0, ecp_1.resolveHost)(args.host ?? process.env.ROKU_DEVICE_IP);
    const level = (args.level ?? 'all').toLowerCase();
    const once = args.once ?? false;
    const captureMs = 8000;
    const ports = [8085, 8080];
    for (const port of ports) {
        try {
            await streamLogs(host, port, { once, level, captureMs });
            return;
        }
        catch (err) {
            if (port === ports[ports.length - 1]) {
                throw new Error(`could not read device logs from ${host} (tried ports ${ports.join(', ')}): ${err?.message ?? err}`);
            }
            // try the next port
        }
    }
}
function streamLogs(host, port, options) {
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
        socket.on('data', (data) => {
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
function matchesLevel(line, level) {
    if (level === 'all' || level === '') {
        return true;
    }
    if (level === 'errors') {
        return /^(\s*\[?error|\berror\b)/i.test(line) || /\*\*ERROR\*\*/i.test(line);
    }
    const wanted = LEVEL_PREFIXES.includes(level) ? [level] : [level];
    return wanted.some((l) => line.toLowerCase().includes(l));
}
