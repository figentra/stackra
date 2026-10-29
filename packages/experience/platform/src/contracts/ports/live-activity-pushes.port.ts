/**
 * Stackra file contract:
 * Purpose: the `LiveActivityPushes` port, the server half of `LiveActivities`: moves a running Live Activity on, ends
 *          it, or starts one remotely, by pushing to the token the device handed over (`pushToken`,
 *          `onPushToStartToken`).
 * Boundary: an abstract class that is its own token, keyed `platform.LiveActivityPushes`; drivers `memory` (`.`) and
 *           `apns` (`./node`). A token the push service reports gone resolves `gone`, and the caller forgets it; any
 *           other refusal throws. The strings arrive translated. Who may push is the calling action's permission.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0255 (push per platform); STA-1539.
 */
import { Port } from "@stackra/contracts";

import type { ActivityProgress } from "#contracts/types/activity-progress.type";

/**
 * Pushes Live Activity updates from the server.
 *
 * @example
 * const outcome = await pushes.send(device.liveActivityToken, "update", { reference: order.id, title, status, step: 3, steps: 4 });
 * if (outcome === "gone") await devices.forgetLiveActivityToken(device.id);
 */
export abstract class LiveActivityPushes extends Port {
  /** Type-only port key, so `DriverName<LiveActivityPushes>` narrows to this port's drivers. */
  declare readonly "~key": "platform.LiveActivityPushes";

  /**
   * Pushes `progress` to `token`: `start` to a push-to-start token, `update` or `end` to a running activity's token.
   *
   * @returns `sent`, or `gone` when the token no longer reaches a device or activity.
   */
  abstract send(
    token: string,
    event: "start" | "update" | "end",
    progress: ActivityProgress,
  ): Promise<"sent" | "gone">;
}
