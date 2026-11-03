"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.key = key;
const ecp_1 = require("../ecp");
/** `roku-zed key <key>` — send a remote-control keypress via ECP. */
async function key(argv, args) {
    const keyName = argv[0];
    if (!keyName) {
        throw new Error('missing key name. Examples: home, rev, fwd, select, left, right, down, up, back, instantreplay, play, stop');
    }
    const host = (0, ecp_1.resolveHost)(args.host ?? process.env.ROKU_DEVICE_IP);
    await (0, ecp_1.sendKeypress)(host, keyName.toLowerCase());
    console.log(`sent key '${keyName.toLowerCase()}' to ${host}`);
}
