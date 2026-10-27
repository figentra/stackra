/**
 * Stackra file contract:
 * Purpose: `SandboxPoolOptions`, how `SandboxPool.open` sizes and guards its processes: how many run at once, how long
 *          a run may outlive its own time limit before its process is killed, how long a new process has to start, and
 *          where the child module is.
 * Boundary: a type only. `size`, `graceMs` and `startupMs` are the host's deployment settings (cores per instance), not
 *           plan values; `startupMs` falls back to `SANDBOX_POOL_DEFAULTS` (STA-1332). A run's own limits stay in its `SandboxLimits`. `module` and `execArgv` default to this package's `./node`
 *           entry and the host's own Node flags (its export conditions); a test passes the source entry.
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2); ADR 0154 (decision 6); STA-1332.
 */

/** The pool's settings. */
export interface SandboxPoolOptions {
  /** The processes, and so the runs at once; a whole number from 1. */
  readonly size: number;

  /** Milliseconds a run may pass its time limit before its process is killed; the run's own interrupt comes first. */
  readonly graceMs: number;

  /**
   * Milliseconds a new process has to say it serves (`ready`) before it is killed and replaced, refusing the run
   * queued on it; `SANDBOX_POOL_DEFAULTS.startupMs` when absent. More than 0.
   */
  readonly startupMs?: number;

  /** The URL of the module that exports `serveSandboxChild`; this package's `./node` entry when absent. */
  readonly module?: string;

  /** The Node flags of each process; the host's own when absent. */
  readonly execArgv?: readonly string[];
}
