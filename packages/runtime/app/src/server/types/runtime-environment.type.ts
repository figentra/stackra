/**
 * Stackra file contract:
 * Purpose: `RuntimeEnvironment`, what the runtime that serves a service says about where it runs: its environment's
 *          name, type and cloud. The generated `stackra-encore/<member>/environment.ts` passes Encore's
 *          `appMeta().environment`, which has this shape.
 * Boundary: a type only; it names no Encore module, so this package never imports the Encore program (ADR 0124).
 * Runtime: node
 * Governing contract: ADR 0091 and 0124 (Encore is generated, outside the service program); ADR 0212 (decisions 1 and
 *                     4), STA-1571.
 */

/** Where the serving runtime runs. */
export interface RuntimeEnvironment {
  /** The runtime's environment name (`local` on a developer machine; an Encore environment's name when deployed). */
  readonly name: string;
  /** `production`, `development`, `ephemeral` (a preview) or `test` (an automated test run). */
  readonly type: string;
  /** The cloud it runs in; `local` only on a developer machine or in a local test run. */
  readonly cloud: string;
}
