/**
 * Stackra file contract:
 * Purpose: the `LiveActivities` port: an order or booking in progress on the Lock Screen and in the Dynamic Island
 *          (an ongoing notification on Android), shown, moved on and ended by the product as the order changes, and
 *          the push tokens its server needs to move it on or start it remotely (`LiveActivityPushes`).
 * Boundary: an abstract class that is its own token, keyed `platform.LiveActivities`; a driver per target implements
 *           it with `extends Driver(LiveActivities)` (memory, Expo). A target without Live Activities (the web, a
 *           phone with them switched off) resolves the `unavailable` refusal, never an exception. A push token is an
 *           address, not a secret, but it is per device: never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3, 2026-10-29 note); ADR 0478 (decision 9: Expo's widget library); STA-1539.
 */
import { Port } from "@stackra/contracts";

import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import type { CapabilityResult } from "#contracts/types/capability-result.type";

/**
 * Shows an order or booking in progress outside the app.
 *
 * @example
 * const activities = useContainer().get(LiveActivities);
 * await activities.show({ reference: order.id, title: t("orders::live.title", order), status: t(`orders::status.${order.status}`), step: 2, steps: 4 });
 * await activities.end(order.id);
 * const token = await activities.pushToken(order.id); // send it to the server, which pushes the next steps
 */
export abstract class LiveActivities extends Port {
  /** Type-only port key, so `DriverName<LiveActivities>` narrows to this port's drivers. */
  declare readonly "~key": "platform.LiveActivities";

  /** Starts the activity of `progress.reference`, or updates it when it already runs. */
  abstract show(progress: ActivityProgress): Promise<CapabilityResult>;

  /** Ends the activity of `reference`, showing `final` until the configured dismissal; unknown ones are ignored. */
  abstract end(reference: string, final?: ActivityProgress): Promise<void>;

  /** The APNs token that moves the running activity of `reference` on remotely; `null` when none is issued yet. */
  abstract pushToken(reference: string): Promise<string | null>;

  /**
   * Calls `listener` with every push-to-start token the OS issues, the address that starts an activity remotely.
   *
   * @returns a function that stops listening.
   */
  abstract onPushToStartToken(listener: (token: string) => void): () => void;
}
