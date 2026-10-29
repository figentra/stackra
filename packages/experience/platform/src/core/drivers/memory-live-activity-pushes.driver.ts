/**
 * Stackra file contract:
 * Purpose: `MemoryLiveActivityPushesDriver`, the `LiveActivityPushes` driver of tests and of a server without APNs
 *          credentials: the `memory` candidate; it records each push so a test can read it.
 * Boundary: nothing leaves the process. A token a test adds to `goneTokens` resolves `gone`. The constructor takes
 *           nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); STA-1539.
 */
import { Driver } from "@stackra/container";

import { LiveActivityPushes } from "#contracts/ports/live-activity-pushes.port";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";

/**
 * Live Activity pushes in memory.
 *
 * @example
 * const pushes = new MemoryLiveActivityPushesDriver();
 * await pushes.send("token", "update", progress);
 * expect(pushes.sent[0]?.event).toBe("update");
 */
export class MemoryLiveActivityPushesDriver extends Driver(LiveActivityPushes) {
  /** Every push sent so far, in order. */
  readonly sent: {
    readonly token: string;
    readonly event: "start" | "update" | "end";
    readonly progress: ActivityProgress;
  }[] = [];

  /** The tokens that answer `gone`; a test adds to it. */
  readonly goneTokens = new Set<string>();

  /** Records the push, or answers `gone` for a token a test marked. */
  async send(
    token: string,
    event: "start" | "update" | "end",
    progress: ActivityProgress,
  ): Promise<"sent" | "gone"> {
    if (this.goneTokens.has(token)) return "gone";
    this.sent.push({ token, event, progress });
    return "sent";
  }
}
