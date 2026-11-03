"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deeplink = deeplink;
const ecp_1 = require("../ecp");
/**
 * `roku-zed deeplink <url>` — launch content on a device via ECP.
 * URL format: `dev:?contentId=xyz&mediaType=movie` or `channelID:?...`
 */
async function deeplink(argv, args) {
    const url = argv[0];
    if (!url) {
        throw new Error('missing deeplink url. Format: `dev:?contentId=xyz&mediaType=movie` (scheme is the app id; `dev` targets the sideloaded channel)');
    }
    const host = (0, ecp_1.resolveHost)(args.host ?? process.env.ROKU_DEVICE_IP);
    await (0, ecp_1.sendDeeplink)(host, url);
    console.log(`sent deeplink to ${host}: ${url}`);
}
