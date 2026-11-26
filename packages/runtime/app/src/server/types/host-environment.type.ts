/**
 * Stackra file contract:
 * Purpose: `HostEnvironment`, the environment the host runtime says the server runs in: Encore's
 *          `appMeta().environment` (`name`, `type`, `cloud`), which the generated Encore app hands
 *          `runningEnvironment`.
 * Boundary: a type only, structural, so this package never imports `encore.dev` (ADR 0124: Encore stays in the
 *           generated app). `encore run` reports `local` / `development` / `local`, `encore test` `test` / `test` /
 *           `local`, Encore Cloud and a self-hosted build with infra metadata their own; a self-hosted build without it
 *           reports an empty name, `development` and `local`.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: the generated Encore app); ADR 0124; ADR 0266 (decision 2); STA-2798.
 */

/** What the host runtime reports about the running environment. */
export interface HostEnvironment {
  /** The environment's name (`local` under `encore run`, `test` under `encore test`). */
  readonly name: string;

  /** `production`, `development`, `ephemeral` (a preview) or `test`. */
  readonly type: string;

  /** Where it runs: `local`, `encore`, `aws`, `gcp` or `azure`. */
  readonly cloud: string;
}
