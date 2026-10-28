/**
 * Stackra file contract:
 * Purpose: the native `posthog` driver of the `AnalyticsDriver` port: the core PostHog driver, buffering on the device
 *          and sending one batch when 20 events wait or when React Native's `AppState` goes to `background`, so a
 *          phone wakes its radio once per batch and the last events of a session leave before the OS suspends it.
 * Boundary: extends the core driver and changes only when it posts; consent, the pre-consent queue and its bound stay
 *           in `AnalyticsClient`, which calls `send` only once the category is granted. The buffer is in memory only.
 *           A failed batch goes back to the front of the buffer, which holds at most 1,000 events (the newest
 *           dropped beyond that, as the client's queue does), and is tried again on the next flush.
 * Runtime: react-native
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071; ADR 0294 (decisions 15, 16 and 17).
 */
import { AppState } from "react-native";

import type { AnalyticsConfig } from "#config/analytics.config";
import type { AnalyticsDelivery } from "#contracts/types/analytics-delivery.type";
import { PosthogAnalyticsDriver as CorePosthogAnalyticsDriver } from "#core/drivers/posthog-analytics.driver";

/** Events that trigger a send while the app is in the foreground. */
const FLUSH_AT = 20;

/** Events the buffer keeps while PostHog cannot be reached. */
const BUFFER_LIMIT = 1000;

/**
 * Sends analytics events to PostHog from a React Native app.
 *
 * @example
 * const driver = new PosthogAnalyticsDriver(config);
 * await driver.send(deliveries); // buffered; sent at 20 events or when the app goes to the background
 */
export class PosthogAnalyticsDriver extends CorePosthogAnalyticsDriver {
  private readonly buffer: AnalyticsDelivery[] = [];

  /**
   * @param config - holds the PostHog project key and host and the ingest origin.
   */
  constructor(config: AnalyticsConfig) {
    super(config);
    // The driver lives as long as the app, so the subscription is never removed.
    AppState.addEventListener("change", (state) => {
      if (state === "background") this.flush().catch(() => undefined);
    });
  }

  /**
   * Buffers `deliveries` in order and sends the buffer once it holds 20 events.
   *
   * @throws Error when that send fails; the events stay buffered for the next flush.
   */
  override send(deliveries: readonly AnalyticsDelivery[]): Promise<void> {
    this.buffer.push(...deliveries);
    return this.buffer.length >= FLUSH_AT ? this.flush() : Promise.resolve();
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
