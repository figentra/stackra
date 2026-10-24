/**
 * Stackra file contract:
 * Purpose: `ServiceDefinition`, what a service member's `stackra.config.ts` passes to `defineService`: its API area,
 *          its extra health checks, its end-to-end seeders and its migration runner.
 * Boundary: a type only; static data. Where it runs is the root runway, what it needs per environment its own
 *           runway, and infrastructure is derived from its modules, so none of that is here.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 1 and 4), ADR 0159 (migrations), ADR 0190 (health checks), ADR 0082 (areas).
 */
import type { ApiArea } from "#core/enums/api-area.enum";
import type { MigrationRunner } from "#core/enums/migration-runner.enum";

/** The definition of a service member. */
export type ServiceDefinition = {
  /** The API area of the service's endpoints, unless an action says otherwise. */
  readonly area: ApiArea;
  /** Dependency checks beyond the derived ones (database, cache, queue, consumed services). */
  readonly health?: { readonly path: string; readonly checks?: readonly string[] };
  /** Seeder keys `<module>.<profile>`, in run order, for the end-to-end tier. */
  readonly e2e?: { readonly seeds: readonly string[] };
  /** How the service's migrations are applied (ADR 0159); `Auto` is the only runner today. */
  readonly migrations?: { readonly runner: MigrationRunner };
};
