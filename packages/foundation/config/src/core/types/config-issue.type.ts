/**
 * Stackra file contract:
 * Purpose: `ConfigIssue`, one problem `ConfigInvalidError` reports: the path of the bad value and what is wrong,
 *          naming the environment variable or the secret it came from.
 * Boundary: a type only. It never holds the value itself, so a secret or a token cannot reach a log through it.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (consequences: config errors fail at boot with the path of the bad value); ADR 0173.
 */

/** One invalid value. */
export interface ConfigIssue {
  /** The field path (`maxRedeemPercent`, `ledgers.primary`), or the variable name for an `env` parser. */
  readonly path: string;

  /** What is wrong, with the variable or secret name when there is one; never the value. */
  readonly message: string;
}
