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
  /** The connection URL's name (`MAIN_DB_URL`). */
  readonly url: string;
  /** The host's name (`MAIN_DB_HOST`). */
  readonly host: string;
  /** The port's name (`MAIN_DB_PORT`). */
  readonly port: string;
  /** The user's name (`MAIN_DB_USER`). */
  readonly user: string;
  /** The password's name (`MAIN_DB_PASSWORD`). */
  readonly password: string;
};
