/**
 * Stackra file contract:
 * Purpose: `MemoryLiveActivitiesDriver`, the `LiveActivities` driver of tests, the web and the desktop: the `memory`
 *          candidate; it keeps what is shown so a test can read it.
 * Boundary: `isAvailable` false makes every `show` resolve the `unavailable` refusal, as a target without Live
 *           Activities does. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); STA-1539.
 */
import { Driver } from "@stackra/container";

import { LiveActivities } from "#contracts/ports/live-activities.port";
import type { ActivityProgress } from "#contracts/types/activity-progress.type";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { LIVE_ACTIVITY_CAPABILITY } from "#core/constants/live-activity-capability.constant";
import { refuse } from "#core/functions/refuse.function";

/**
 * Live Activities in memory.
 *
 * @example
 * const activities = new MemoryLiveActivitiesDriver();
 * await activities.show(progress);
 * expect(activities.shown.get(progress.reference)?.step).toBe(2);
 */
export class MemoryLiveActivitiesDriver extends Driver(LiveActivities) {
  /** The running activities by reference, with what each shows now. */
  readonly shown = new Map<string, ActivityProgress>();

  /** The references ended so far, in order. */
  readonly ended: string[] = [];

  /** Whether this target offers Live Activities; a test sets it. */
  isAvailable = true;

  /** Records `progress` under its reference, or refuses when unavailable. */
  async show(progress: ActivityProgress): Promise<CapabilityResult> {
    if (!this.isAvailable) return refuse(LIVE_ACTIVITY_CAPABILITY, "unavailable");
    this.shown.set(progress.reference, progress);
    return { ok: true, data: undefined };
  }

  /** Drops the activity of `reference` and records the end. */
  async end(reference: string): Promise<void> {
    if (this.shown.delete(reference)) this.ended.push(reference);
  }
}
