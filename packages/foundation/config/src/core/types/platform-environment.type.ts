/**
 * Stackra file contract:
 * Purpose: `PlatformEnvironment`, what the platform that serves a process reports about where it runs: its
 *          environment's name, type and cloud. The generated Encore `environment.ts` passes Encore's
 *          `appMeta().environment`, which has this shape; `readEnvironment` derives the running environment from it.
 * Boundary: a type only, structural, so no package imports `encore.dev` for it (ADR 0124). What Encore reports:
 *           `encore run` is name `local`, type `development`, cloud `local`; `encore test` is `test` / `test` / `local`;
 *           Encore Cloud and a self-hosted image with infra metadata report their own; a self-hosted image without
 *           that metadata reports an empty name, `development` and `local`, which is not a developer machine.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2) and ADR 0124 (Encore stays in the generated app); ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */

/** Where the serving platform says the process runs. */
export interface PlatformEnvironment {
  /** The environment's name (`local` under `encore run`, `test` under `encore test`, a deployment's own name). */
  readonly name: string;

  /** `production`, `development`, `ephemeral` (a preview) or `test`. */
  readonly type: string;

  /** Where it runs: `local`, `encore`, `aws`, `gcp` or `azure`. */
  readonly cloud: string;
}
