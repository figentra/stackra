/**
 * Stackra file contract:
 * Purpose: `DeployLock`, the lock store `withDeployLock` takes so that one apply runs per environment at a time: a
 *          code deploy, a promotion, a rollback or a settings promotion (`settings:apply`).
 * Boundary: a type only, shaped as `Locks#tryWith` of @stackra/locking, so the caller passes its `Locks` (Postgres or
 *           Valkey, picked by `locking.driver`) and runway takes no dependency on it. Never waits: a held lock refuses.
 * Runtime: isomorphic
 * Governing contract: ADR 0103 (decision 1), ADR 0149, ADR 0352 (decision 3), ADR 0435 (decision 2).
 */
import type { Duration } from "@stackra/contracts";

/**
 * Runs work under a named lock, only when it is free now.
 *
 * @example
 * const lock: DeployLock = locks; // a @stackra/locking `Locks`
 */
export type DeployLock = {
  /** Runs `work` holding `key` when no one holds it now, renewing the lease while it runs; `true` when it ran. */
  tryWith: (key: string, ttl: Duration, work: () => Promise<void>) => Promise<boolean>;
};
