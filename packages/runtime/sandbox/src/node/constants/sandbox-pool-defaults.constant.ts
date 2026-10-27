/**
 * Stackra file contract:
 * Purpose: `SANDBOX_POOL_DEFAULTS`, the pool settings a host may leave out of `SandboxPoolOptions`: how long a new
 *          process has to say it serves before it is killed and replaced.
 * Boundary: internal. Thirty seconds covers a cold Node boot, the package import and the engine load on a loaded host
 *           many times over, so only a process that hangs during start-up meets it; a host overrides it with its own
 *           deployment setting (`startupMs`). Not a run limit: every run limit stays the run's own `SandboxLimits`.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2); ADR 0154 (decision 6); STA-1332.
 */

/** The pool defaults. */
export const SANDBOX_POOL_DEFAULTS = Object.freeze({
  /** Milliseconds a new process has to send `ready` before it is killed and replaced. */
  startupMs: 30_000,
});
