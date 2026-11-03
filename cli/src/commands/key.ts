import { resolveHost, sendKeypress } from '../ecp';
import { CommonArgs } from './common';

/** `roku-zed key <key>` — send a remote-control keypress via ECP. */
export async function key(argv: string[], args: CommonArgs): Promise<void> {
    const keyName = argv[0];
    if (!keyName) {
        throw new Error(
            'missing key name. Examples: home, rev, fwd, select, left, right, down, up, back, instantreplay, play, stop'
        );
    }
    const host = resolveHost(args.host ?? process.env.ROKU_DEVICE_IP);
    await sendKeypress(host, keyName.toLowerCase());
    console.log(`sent key '${keyName.toLowerCase()}' to ${host}`);
}
