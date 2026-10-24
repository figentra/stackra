/**
 * Stackra file contract:
 * Purpose: the `DeviceTelemetry` port: a device reports its measurements to the hub.
 * Boundary: an abstract class that is its own token; drivers implement it with `extends Driver(DeviceTelemetry)`. The
 *           HTTP driver ships now and an MQTT driver later, behind this same port (ADR 0235). The device is the
 *           caller's credential, never a field of a reading.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { TelemetryReading } from "#contracts/types/telemetry-reading.type";

/**
 * Reports a device's measurements.
 *
 * @example
 * constructor(telemetry: DeviceTelemetry) { ... }
 *
 * await this.telemetry.report([{ metric: "temperature", value: 21.5, unit: "celsius", at: this.clock.now() }]);
 */
export abstract class DeviceTelemetry extends Port {
  /** Sends `readings` in one batch; an empty batch sends nothing. Rejects when the hub refuses them. */
  abstract report(readings: readonly TelemetryReading[]): Promise<void>;
}
