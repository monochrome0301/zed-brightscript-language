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
exports.resolveHost = resolveHost;
exports.getDeviceInfo = getDeviceInfo;
exports.sendKeypress = sendKeypress;
exports.sendDeeplink = sendDeeplink;
exports.discoverDevices = discoverDevices;
const dgram = __importStar(require("dgram"));
const http = __importStar(require("http"));
/** Extracts a device host ("IP[:port]") from args or config, or throws. */
function resolveHost(raw) {
    const host = (raw ?? '').trim();
    if (!host) {
        throw new Error('No device host given. Pass one (e.g. `--host 192.168.1.100`) or run `roku-zed discover` to find devices.');
    }
    return host;
}
function textOf(xml, tag) {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml);
    return match ? match[1].trim() : undefined;
}
/** Fetches and parses `<host>/query/device-info` over ECP. */
function getDeviceInfo(host, timeoutMs = 3000) {
    const [hostname, port = '8060'] = host.split(':');
    return new Promise((resolve, reject) => {
        const req = http.get({ host: hostname, port: Number(port), path: '/query/device-info', timeout: timeoutMs }, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                resolve({
                    ip: host,
                    friendlyDeviceName: textOf(body, 'friendly-device-name'),
                    modelName: textOf(body, 'model-name'),
                    modelNumber: textOf(body, 'model-number'),
                    softwareVersion: textOf(body, 'software-version'),
                    powerMode: textOf(body, 'power-mode'),
                    usbConnected: textOf(body, 'usb-is-connected') === 'true',
                });
            });
        });
        req.on('timeout', () => req.destroy(new Error(`timeout querying ${host}`)));
        req.on('error', reject);
    });
}
/** Sends a remote-control keypress: POST /keypress/<key>. */
function sendKeypress(host, key) {
    const [hostname, port = '8060'] = host.split(':');
    if (!/^[A-Za-z0-9_.]+$/.test(key)) {
        throw new Error(`invalid key name: ${key}`);
    }
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: hostname,
            port: Number(port),
            path: `/keypress/${encodeURIComponent(key)}`,
            method: 'POST',
            timeout: 3000,
        }, (res) => {
            res.resume();
            res.on('end', () => {
                if (res.statusCode && res.statusCode < 400) {
                    resolve();
                }
                else {
                    reject(new Error(`keypress failed with HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('timeout', () => req.destroy(new Error(`timeout sending keypress to ${host}`)));
        req.on('error', reject);
        req.end();
    });
}
/** Sends a deeplink: POST /launch/<appId>?contentId=...&mediaType=... */
function sendDeeplink(host, url) {
    const parsed = new URL(url);
    const appId = parsed.protocol.replace(/:$/, '') || 'dev';
    const [hostname, port = '8060'] = host.split(':');
    const params = new URLSearchParams();
    parsed.searchParams.forEach((value, key) => {
        if (key.toLowerCase() !== 'host') {
            params.set(key, value);
        }
    });
    const query = params.toString();
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: hostname,
            port: Number(port),
            path: `/launch/${encodeURIComponent(appId)}${query ? `?${query}` : ''}`,
            method: 'POST',
            timeout: 3000,
        }, (res) => {
            res.resume();
            res.on('end', () => {
                if (res.statusCode && res.statusCode < 400) {
                    resolve();
                }
                else {
                    reject(new Error(`deeplink failed with HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('timeout', () => req.destroy(new Error(`timeout sending deeplink to ${host}`)));
        req.on('error', reject);
        req.end();
    });
}
/**
 * Discovers Roku devices via SSDP M-SEARCH for `roku:ecp`, then enriches
 * each result with `/query/device-info`.
 */
async function discoverDevices(timeoutMs = 5000) {
    const foundHosts = await new Promise((resolve) => {
        const found = new Set();
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        const finish = () => {
            try {
                socket.close();
            }
            catch {
                // already closed
            }
            resolve(found);
        };
        const query = Buffer.from([
            'M-SEARCH * HTTP/1.1',
            'Host: 239.255.255.250:1900',
            'Man: "ssdp:discover"',
            'MX: 4',
            'ST: roku:ecp',
            '',
            '',
        ].join('\r\n'));
        socket.on('error', finish);
        socket.on('message', (msg) => {
            const text = msg.toString();
            const location = /^LOCATION:\s*(.+)$/im.exec(text)?.[1]?.trim();
            if (location) {
                try {
                    found.add(new URL(location).host);
                }
                catch {
                    // ignore malformed LOCATION headers
                }
            }
        });
        socket.bind(() => {
            try {
                socket.addMembership('239.255.255.250');
            }
            catch {
                // multicast membership is best-effort (e.g. VPN interfaces)
            }
            socket.send(query, 1900, '239.255.255.250');
            // send twice: a single M-SEARCH is occasionally dropped
            setTimeout(() => {
                try {
                    socket.send(query, 1900, '239.255.255.250');
                }
                catch {
                    // socket already gone
                }
            }, Math.min(1500, timeoutMs / 2));
        });
        setTimeout(finish, timeoutMs);
    });
    return enrichDevices([...foundHosts]);
}
async function enrichDevices(hosts) {
    const devices = await Promise.allSettled(hosts.map((host) => getDeviceInfo(host)));
    return devices
        .filter((d) => d.status === 'fulfilled')
        .map((d) => d.value);
}
