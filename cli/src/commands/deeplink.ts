import { resolveHost, sendDeeplink } from '../ecp';
import { CommonArgs } from './common';

/**
 * `roku-zed deeplink <url>` — launch content on a device via ECP.
 * URL format: `dev:?contentId=xyz&mediaType=movie` or `channelID:?...`
 */
export async function deeplink(argv: string[], args: CommonArgs): Promise<void> {
    const url = argv[0];
    if (!url) {
        throw new Error(
            'missing deeplink url. Format: `dev:?contentId=xyz&mediaType=movie` (scheme is the app id; `dev` targets the sideloaded channel)'
        );
    }
    const host = resolveHost(args.host ?? process.env.ROKU_DEVICE_IP);
    await sendDeeplink(host, url);
    console.log(`sent deeplink to ${host}: ${url}`);
}
