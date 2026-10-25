/**
 * Stackra file contract:
 * Purpose: `CURRENT_SCHEDULER`, the scheduler service of the testing app compiled last, which `tick` uses.
 * Boundary: internal to `./testing`; set by the testing-module plugin on every compile (to `undefined` when the app
 *           binds no `SchedulerService`), so each test module ticks its own container's scheduler.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { SchedulerService } from "#core/index";

/** The last compiled testing app's scheduler. */
export const CURRENT_SCHEDULER: { value: SchedulerService | undefined } = { value: undefined };
