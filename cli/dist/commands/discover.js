"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discover = discover;
const ecp_1 = require("../ecp");
/** `roku-zed discover` — list Roku devices on the network (SSDP + ECP). */
async function discover(args) {
    const timeoutMs = args.host ? 3000 : 5000;
    const devices = await (0, ecp_1.discoverDevices)(timeoutMs);
    if (devices.length === 0) {
        console.log('No Roku devices found.');
        console.log('  - make sure the device is on the same network and powered on');
        console.log('  - check Settings > Network > About for its IP and pass --host');
        return;
    }
    console.log(`Found ${devices.length} device(s):\n`);
    for (const device of devices) {
        console.log(`  ${device.ip}`);
        if (device.friendlyDeviceName) {
            console.log(`    name:     ${device.friendlyDeviceName}`);
        }
        if (device.modelName) {
            console.log(`    model:    ${device.modelName} (${device.modelNumber ?? '?'})`);
        }
        if (device.softwareVersion) {
            console.log(`    software: ${device.softwareVersion}`);
        }
        if (device.powerMode) {
            console.log(`    power:    ${device.powerMode}`);
        }
        console.log('');
    }
}
