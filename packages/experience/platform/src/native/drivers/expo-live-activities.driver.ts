/**
 * Stackra file contract:
 * Purpose: `ExpoLiveActivitiesDriver`, the `LiveActivities` driver of the Expo (phone) target: an order or booking in
 *          progress as the `OrderProgress` Live Activity through expo-widgets.
 * Boundary: iOS only; Android resolves `unavailable`, and so does a start the OS refuses (Live Activities switched off,
 *           iOS before 16.2, an Expo Go session). An ended activity stays for `endedDismissal`. The widget extension
 *           target comes from expo-widgets' config plugin, listed in the app config by gen.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 3); ADR 0478 (decision 9); ADR 0294 (decision 17: dependencies by type); STA-1539.
 */
import { Duration } from "@stackra/contracts";
import { Driver } from "@stackra/container";
import { after } from "expo-widgets";
import type { LiveActivity } from "expo-widgets";
import { Platform as Os } from "react-native";

import type { LiveActivityConfig } from "#config/live-activity.config";
import { LiveActivities } from "#contracts/ports/live-activities.port";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { LIVE_ACTIVITY_CAPABILITY } from "#core/constants/live-activity-capability.constant";
import { refuse } from "#core/functions/refuse.function";
import { ORDER_PROGRESS_ACTIVITY } from "#native/constants/order-progress-activity.constant";
import type { OrderProgressProps } from "#native/types/order-progress-props.type";

/**
 * Live Activities on a phone.
 *
 * @example
 * // generated wiring, expo target
 * { port: LiveActivities, candidates: { expo: () => import("@stackra/platform/native").then((m) => m.ExpoLiveActivitiesDriver) } }
 */
export class ExpoLiveActivitiesDriver extends Driver(LiveActivities) {
  /** The Live Activity configuration (`endedDismissal`). */
  private readonly config: LiveActivityConfig;

  // shortcut: the map lives as long as the app process, so an activity started before a relaunch is not updated
  // (expo-widgets' getInstances() carries no reference); persist reference to push token when a product needs it.
  /** The running activities by reference. */
  private readonly running = new Map<string, LiveActivity<OrderProgressProps>>();

  /**
   * @param config - the Live Activity configuration.
   */
  constructor(config: LiveActivityConfig) {
    super();
    this.config = config;
  }

  /** Starts the activity of `progress.reference`, or updates the running one. */
  async show({ url, ...props }: ActivityProgress): Promise<CapabilityResult> {
    if (Os.OS !== "ios") return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
    try {
      const running = this.running.get(props.reference);
      if (running) await running.update(props);
      else this.running.set(props.reference, ORDER_PROGRESS_ACTIVITY.start(props, url));
      return { ok: true, data: undefined };
    } catch {
      return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
    }
  }

  /** Ends the activity of `reference` with `final` shown until the configured dismissal. */
  async end(reference: string, final?: ActivityProgress): Promise<void> {
    const running = this.running.get(reference);
    if (!running) return;
    this.running.delete(reference);
    const until = new Date(Date.now() + Duration.toMilliseconds(this.config.endedDismissal));
    await running.end(after(until), final, new Date());
  }
}
