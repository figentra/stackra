/**
 * Stackra file contract:
 * Purpose: `ResourceVariables`, the variable names one resource's connection details reach its consumers under: the
 *          URL, host, port, user and password, each `<RESOURCE>_<PART>` (`MAIN_DB_URL`).
 * Boundary: type only; names, never values.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 4), ADR 0173 (names in git).
 */

/** One resource's variable names. */
export type ResourceVariables = {
  readonly url: string;
  readonly host: string;
  readonly port: string;
  readonly user: string;
  readonly password: string;
};
