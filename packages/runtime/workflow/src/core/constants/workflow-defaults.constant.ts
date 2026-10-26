/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_DEFAULTS`, the engine's fixed numbers: the run lock's lease, the worker's idle poll and batch, how
 *          long an untaken signal is held, the context a run started outside a call takes, and the log event of a tick
 *          that failed.
 * Boundary: internal constants; nothing here is configuration. The context defaults are the action pipeline's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0102 (decision 1); ADR 0149 (a lease renewed while the work runs); ADR 0152 (0294 note:
 *                     early signals are held); ADR 0147 (log events are snake_case codes).
 */
import { Duration } from "@stackra/contracts";

/** The engine's defaults. */
export const WORKFLOW_DEFAULTS = Object.freeze({
  /** The lease of a run's lock, renewed every third of it while the run advances. */
  lease: Duration.minutes(5),
  /** How long an idle worker waits before its next tick. */
  pollMilliseconds: 1000,
  /** The most runs one tick advances. */
  batch: 100,
  /** How long a signal no run took is held before it is dropped, when no `WorkflowConfig` is given. */
  signalHoldMilliseconds: Duration.toMilliseconds(Duration.days(7)),
  /** The context of a run started outside an action call (a `startOn` event, a test). */
  origin: Object.freeze({ locale: "en", timeZone: "UTC", currency: "USD", market: "default" }),
  /** Logged when a worker tick failed and paused. */
  tickFailed: "workflow.tick_failed",
});
