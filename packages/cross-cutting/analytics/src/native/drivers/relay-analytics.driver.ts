/**
 * Stackra file contract:
 * Purpose: the native `relay` driver of the `AnalyticsDriver` port: the core relay, buffering on the device and sending
 *          one batch when 20 events wait or when React Native's `AppState` goes to `background`, and stamping the
 *          coarse `context.device` (OS and OS version) a vendor SDK used to collect (ADR 0483 decision 6).
 * Boundary: extends the core driver and changes only when it posts and the device record; consent, the pre-consent
 *           queue and its bound stay in `AnalyticsClient`. The buffer is in memory only, as in the native PostHog
 *           driver: a failed batch goes back to the front (at most 1,000 events, the newest dropped beyond that) and
 *           `send` resolves once the buffer holds the events, so the client never retries what the buffer owns. A
 *           delivery that already carries `context.device` keeps it; nothing else about the device is read.
 * Runtime: react-native
 * Governing contract: ADR 0483 (decisions 1 and 6); ADR 0298 (decisions 1 and 5); ADR 0294 (decisions 15 to 17).
 */
import type { ConsentLedger } from "@stackra/consent";
import { AppState, Platform } from "react-native";

import type { AnalyticsConfig } from "#config/analytics.config";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { RelayAnalyticsDriver as CoreRelayAnalyticsDriver } from "#core/drivers/relay-analytics.driver";

/** Events that trigger a send while the app is in the foreground. */
const FLUSH_AT = 20;

/** Events the buffer keeps while the analytics service cannot be reached. */
const BUFFER_LIMIT = 1000;

/**
 * Sends analytics events to the analytics service from a React Native app.
 *
 * @example
 * const driver = new RelayAnalyticsDriver(config, ledger);
 * await driver.send(deliveries); // buffered; sent at 20 events or when the app goes to the background
 */
export class RelayAnalyticsDriver extends CoreRelayAnalyticsDriver {
  private readonly buffer: AnalyticsDelivery[] = [];

  /**
   * @param config - holds the ingest origin.
   * @param ledger - the consent decision a snapshot is asked for.
   */
  constructor(config: AnalyticsConfig, ledger: ConsentLedger) {
    super(config, ledger);
    // The driver lives as long as the app, so the subscription is never removed.
    AppState.addEventListener("change", (state) => {
      if (state === "background") this.flush().catch(() => undefined);
    });
  }

  /** Buffers `deliveries` in order and sends the buffer once it holds 20 events; a failed post keeps them. */
  override send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    const device = { os: Platform.OS, osVersion: String(Platform.Version) };
    this.buffer.push(
      ...deliveries.map((delivery) =>
        delivery.context.device === undefined
          ? { ...delivery, context: { ...delivery.context, device } }
          : delivery,
      ),
    );
    return this.buffer.length >= FLUSH_AT ? this.flush().catch(() => undefined) : Promise.resolve();
  }

  /** Sends everything buffered as one batch; on failure puts it back in front, within the buffer limit. */
  private async flush(): Promise<void> {
    const batch = this.buffer.splice(0);
    try {
      await this.post(batch);
    } catch (error) {
      this.buffer.unshift(...batch);
      this.buffer.length = Math.min(this.buffer.length, BUFFER_LIMIT);
      throw error;
    }
  }
}
