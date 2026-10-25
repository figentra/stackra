/**
 * Stackra file contract:
 * Purpose: the `CronScopes` port: the scopes a cron of an action fans out over when it runs once per scope
 *          (`job: { cron: { perScope: true } }`); each tick pushes one job per scope it lists.
 * Boundary: an abstract class that is its own token, keyed `scheduler.CronScopes`. The package that owns the scope
 *           level a deployment schedules by binds the driver (@stackra/tenancy lists its active nodes); the memory
 *           driver lists what a test or a single process set. It names no scope level (ADR 0323). A leaf
 *           file: it imports nothing outside `src/contracts` but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 2 and 5); ADR 0323 (`ScopeRef`); ADR 0327 (decision 8: tenancy is a scope
 *                     consumer); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

/**
 * The scopes a per-scope cron runs in.
 *
 * @example
 * export class TenancyCronScopesDriver extends Driver(CronScopes) {
 *   async list(): Promise<readonly ScopeRef[]> { ... }
 * }
 */
export abstract class CronScopes extends Port {
  /** Type-only port key, so `DriverName<CronScopes>` narrows to this port's drivers. */
  declare readonly "~key": "scheduler.CronScopes";

  /** Every scope a per-scope cron runs in now. */
  abstract list(): Promise<readonly ScopeRef[]>;
}
