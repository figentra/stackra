/**
 * Stackra file contract:
 * Purpose: the HTTP driver of the `DeviceTelemetry` port: one `POST /devices/report` per batch, `{ readings }` as JSON
 *          with each `at` as an ISO 8601 date-time.
 * Boundary: calls through `hubSender`, so the batch carries one `Idempotency-Key` across its retries and the hub
 *           stores it once. An empty batch makes no call. The response body is discarded.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2: the HTTP driver ships now); ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";

import { DevicesConfig } from "#config/devices.config";
import { DeviceCredential } from "#contracts/ports/device-credential.port";
import { DeviceTelemetry } from "#contracts/ports/device-telemetry.port";
import type { TelemetryReading } from "#contracts/types/telemetry-reading.type";
import { DEVICE_HUB_PATHS } from "#core/constants/device-hub-paths.constant";
import { hubSender } from "#core/functions/hub-sender.function";

/** Reports telemetry over HTTP. */
export class HttpDeviceTelemetryDriver extends Driver(DeviceTelemetry) {
  private readonly send: ReturnType<typeof hubSender>;

  /**
   * @param config - the hub URL, timeout and attempts.
   * @param credential - the device's token.
   * @throws TypeError when `config.hubUrl` is `null`.
   */
  constructor(config: DevicesConfig, credential: DeviceCredential) {
    super();
    this.send = hubSender(config, credential);
  }

  /** Sends `readings` in one batch; an empty batch sends nothing. */
  async report(readings: readonly TelemetryReading[]): Promise<void> {
    if (readings.length === 0) return;
    const response = await this.send(DEVICE_HUB_PATHS.report, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ readings }),
    });
    await response.body?.cancel();
  }
}
