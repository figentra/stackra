/**
 * Stackra file contract:
 * Purpose: `DeviceAcknowledgedInput`, the input of `devices.device.acknowledged@1`: nothing for the calling device's
 *          own sequence, or another device's id to list what a lost or revoked device last had acknowledged.
 * Boundary: a shape class in its own file. The calling device is never input: it is `ctx.deviceId`, which the transport
 *           set from `DEVICE_ORDER.deviceHeader` after matching the verified session's device. It registers its schema
 *           when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0338 (decision 4: the server lists a device's last acknowledged sequence); ADR 0294
 *                     (decisions 4, 13 and 26); ADR 0305 (one declaration per file).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Whose last acknowledged sequence.
 *
 * @example
 * DeviceAcknowledgedInput.create({}); // the calling device
 * DeviceAcknowledgedInput.create({ deviceId: "dev_till_7" }); // a lost till, for the shop
 */
export class DeviceAcknowledgedInput extends Schema {
  /** Another device's id; absent for the calling device. */
  deviceId?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[DeviceAcknowledgedInput, z.object({ deviceId: z.string().min(1).optional() })]]);
