/**
 * Stackra file contract:
 * Purpose: `DeviceAcknowledgedOutput`, the answer of `devices.device.acknowledged@1`: the highest sequence the server
 *          applied or rejected for the device, or `null` when it has none (or none the caller may see).
 * Boundary: a shape class in its own file, the `{ sequence: number | null }` that `DEVICE_ORDER.acknowledgedQuery` of
 *           `@stackra/clients` names and `@stackra/query`'s `AcknowledgementReader` reads. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0338 (decisions 1 and 4); ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per
 *                     file).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * A device's last acknowledged sequence.
 *
 * @example
 * return DeviceAcknowledgedOutput.create({ sequence: last?.sequence ?? null });
 */
export class DeviceAcknowledgedOutput extends Schema {
  /** The highest applied or rejected sequence, a whole number from 1; `null` when there is none. */
  @Int({ min: 1 })
  sequence!: number | null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [DeviceAcknowledgedOutput, z.object({ sequence: z.number().int().min(1).nullable() })],
]);
