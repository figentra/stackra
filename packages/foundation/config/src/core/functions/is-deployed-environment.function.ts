/**
 * Stackra file contract:
 * Purpose: `isDeployedEnvironment(environment)`, the one gate for "outside dev and test": true for `preview`,
 *          `staging` and `production`. A package refuses a dev-only default there (a memory store, a scanner that
 *          marks every file clean, an unbound audit trail, dev sign-in), given the environment `readEnvironment`
 *          returned (STA-2844).
 * Boundary: pure; takes a `StackraEnvironment`, never a free string, so a typo cannot read as not deployed.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver never reaches a deployment); ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */
import { StackraEnvironment } from "#core/enums/stackra-environment.enum";

/**
 * Whether `environment` is a deployment, where every check that dev and test relax applies.
 *
 * @param environment - the running environment, from `readEnvironment`.
 * @example
 * if (isDeployedEnvironment(readEnvironment(process.env))) refuseMemoryStores();
 */
export function isDeployedEnvironment(environment: StackraEnvironment): boolean {
  return environment !== StackraEnvironment.Dev && environment !== StackraEnvironment.Test;
}
