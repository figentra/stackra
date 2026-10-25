/**
 * Stackra file contract:
 * Purpose: `SandboxLimits`, the bounds of one run: its wall time, its heap and its output.
 * Boundary: a type only. The values are data the caller reads from the tenant's plan (the plan catalogue's automation
 *           limits), never constants here, so this package holds no tier policy.
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decision 6); config-model (limits on cost drivers are plan-catalogue data).
 */
import type { Duration } from "@stackra/contracts";

/**
 * The bounds of a run.
 *
 * @example
 * const limits: SandboxLimits = { time: Duration.seconds(plan.codeSeconds), memoryBytes: plan.codeMemoryBytes, outputBytes: plan.codeOutputBytes };
 */
export interface SandboxLimits {
  /** The wall time from start to result, waits on `fetch` included; longer than zero. */
  readonly time: Duration;

  /** The heap of the run's QuickJS runtime, in bytes. */
  readonly memoryBytes: number;

  /** The UTF-8 bytes of the result's JSON and every logged line together. */
  readonly outputBytes: number;
}
