/**
 * Stackra file contract:
 * Purpose: `UNAUDITED_ENVIRONMENTS`, the running environments (`AuditConfig.environment`, from `STACKRA_ENVIRONMENT`)
 *          where an action may run with no `AuditTrail` bound: `dev` and `test` only.
 * Boundary: a list of names; the pipeline reads it. Every other name (`preview`, `staging`, `production`, a typo)
 *           needs an `AuditTrail`, so a misspelt environment fails closed, never open. Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 1 and 4: every action audited, evidence with the change); STA-1571.
 */

/** The environments that may run an action unaudited. */
export const UNAUDITED_ENVIRONMENTS: readonly string[] = Object.freeze(["dev", "test"]);
