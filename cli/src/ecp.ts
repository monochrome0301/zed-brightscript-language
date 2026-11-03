import * as dgram from 'dgram';
import * as http from 'http';

/**
 * ECP (External Control Protocol) + SSDP discovery helpers.
 * No external dependencies: plain HTTP/dgram against port 8060/1900.
 */

export interface RokuDevice {
    ip: string;
    friendlyDeviceName?: string;
    modelName?: string;
    modelNumber?: string;
    softwareVersion?: string;
    powerMode?: string;
    usbConnected?: boolean;
}

/** Extracts a device host ("IP[:port]") from args or config, or throws. */
export function resolveHost(raw: string | undefined | null): string {
    const host = (raw ?? '').trim();
    if (!host) {
        throw new Error(
            'No device host given. Pass one (e.g. `--host 192.168.1.100`) or run `roku-zed discover` to find devices.'
        );
    }
    return host;
}

function textOf(xml: string, tag: string): string | undefined {
    const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml);
    return match ? match[1].trim() : undefined;
}

/** Fetches and parses `<host>/query/device-info` over ECP. */
export function getDeviceInfo(host: string, timeoutMs = 3000): Promise<RokuDevice> {
    const [hostname, port = '8060'] = host.split(':');
    return new Promise((resolve, reject) => {
        const req = http.get(
            { host: hostname, port: Number(port), path: '/query/device-info', timeout: timeoutMs },
            (res) => {
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
            }
        );
        req.on('timeout', () => req.destroy(new Error(`timeout querying ${host}`)));
        req.on('error', reject);
    });
}

/** Sends a remote-control keypress: POST /keypress/<key>. */
export function sendKeypress(host: string, key: string): Promise<void> {
    const [hostname, port = '8060'] = host.split(':');
    if (!/^[A-Za-z0-9_.]+$/.test(key)) {
        throw new Error(`invalid key name: ${key}`);
    }
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                host: hostname,
                port: Number(port),
                path: `/keypress/${encodeURIComponent(key)}`,
                method: 'POST',
                timeout: 3000,
            },
            (res) => {
                res.resume();
                res.on('end', () => {
                    if (res.statusCode && res.statusCode < 400) {
                        resolve();
                    } else {
                        reject(new Error(`keypress failed with HTTP ${res.statusCode}`));
                    }
                });
            }
        );
        req.on('timeout', () => req.destroy(new Error(`timeout sending keypress to ${host}`)));
        req.on('error', reject);
        req.end();
    });
}

/** Sends a deeplink: POST /launch/<appId>?contentId=...&mediaType=... */
export function sendDeeplink(host: string, url: string): Promise<void> {
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
        const req = http.request(
            {
                host: hostname,
                port: Number(port),
                path: `/launch/${encodeURIComponent(appId)}${query ? `?${query}` : ''}`,
                method: 'POST',
                timeout: 3000,
            },
            (res) => {
                res.resume();
                res.on('end', () => {
                    if (res.statusCode && res.statusCode < 400) {
                        resolve();
                    } else {
                        reject(new Error(`deeplink failed with HTTP ${res.statusCode}`));
                    }
                });
            }
        );
        req.on('timeout', () => req.destroy(new Error(`timeout sending deeplink to ${host}`)));
        req.on('error', reject);
        req.end();
    });
}

/**
 * Discovers Roku devices via SSDP M-SEARCH for `roku:ecp`, then enriches
 * each result with `/query/device-info`.
 */
export async function discoverDevices(timeoutMs = 5000): Promise<RokuDevice[]> {
    const foundHosts = await new Promise<Set<string>>((resolve) => {
        const found = new Set<string>();
        const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        const finish = () => {
            try {
                socket.close();
            } catch {
                // already closed
            }
            resolve(found);
        };

        const query = Buffer.from(
            [
                'M-SEARCH * HTTP/1.1',
                'Host: 239.255.255.250:1900',
                'Man: "ssdp:discover"',
                'MX: 4',
                'ST: roku:ecp',
                '',
                '',
            ].join('\r\n')
        );

        socket.on('error', finish);
        socket.on('message', (msg: Buffer) => {
            const text = msg.toString();
            const location = /^LOCATION:\s*(.+)$/im.exec(text)?.[1]?.trim();
            if (location) {
                try {
                    found.add(new URL(location).host);
                } catch {
                    // ignore malformed LOCATION headers
                }
            }
        });

        socket.bind(() => {
            try {
                socket.addMembership('239.255.255.250');
            } catch {
                // multicast membership is best-effort (e.g. VPN interfaces)
            }
            socket.send(query, 1900, '239.255.255.250');
            // send twice: a single M-SEARCH is occasionally dropped
            setTimeout(() => {
                try {
                    socket.send(query, 1900, '239.255.255.250');
                } catch {
                    // socket already gone
                }
            }, Math.min(1500, timeoutMs / 2));
        });

        setTimeout(finish, timeoutMs);
    });

    return enrichDevices([...foundHosts]);
}

async function enrichDevices(hosts: string[]): Promise<RokuDevice[]> {
    const devices = await Promise.allSettled(
        hosts.map((host) => getDeviceInfo(host))
    );
    return devices
        .filter((d): d is PromiseFulfilledResult<RokuDevice> => d.status === 'fulfilled')
        .map((d) => d.value);
}
