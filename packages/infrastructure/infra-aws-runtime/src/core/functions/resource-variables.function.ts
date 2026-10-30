/**
 * Stackra file contract:
 * Purpose: `resourceVariables(resource)`, the variable names a resource's connection details reach its consumers
 *          under: the runway name in SCREAMING_SNAKE with `_URL`, `_HOST`, `_PORT`, `_USER` and `_PASSWORD`.
 * Boundary: pure; names only.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (decision 4), ADR 0231 (SCREAMING_SNAKE variables).
 */
import type { ResourceVariables } from "#core/types/resource-variables.type";

/**
 * The variable names of `resource`.
 *
 * @example
 * resourceVariables("main-db").url; // "MAIN_DB_URL"
 */
export function resourceVariables(resource: string): ResourceVariables {
  const stem = resource.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_");
  return {
    url: `${stem}_URL`,
    host: `${stem}_HOST`,
    port: `${stem}_PORT`,
    user: `${stem}_USER`,
    password: `${stem}_PASSWORD`,
  };
}
