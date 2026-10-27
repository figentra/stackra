/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/devices (the `devices.device.acknowledged` query and its input
 *          and output schemas) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server-side only: it imports `@stackra/actions`, which the `.`
 *           and `./contracts` entries a device app loads never do.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DevicePermissions } from "#node/access/device.permissions";
export { DeviceAcknowledgedQuery } from "#node/queries/device-acknowledged.query";
export { DeviceAcknowledgedInput } from "#node/schemas/device-acknowledged-input.schema";
export { DeviceAcknowledgedOutput } from "#node/schemas/device-acknowledged-output.schema";
