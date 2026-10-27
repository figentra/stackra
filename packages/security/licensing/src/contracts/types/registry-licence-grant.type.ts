/**
 * Stackra file contract:
 * Purpose: `RegistryLicenceGrant`, one grant of a Stackra registry licence: the names of a `licensed` scope the
 *          licence may read, `*` for every name (an item of any kind is a name).
 * Boundary: a type only; the leaf `./contracts` entry. The registry Worker (`workers/registry`) and the `registry`
 *           `LicenceIssuer` driver both read it; Figentra OS billing writes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 13 and 14); stackra-183 (STA-1335).
 */

/**
 * One grant.
 *
 * @example
 * const grant: RegistryLicenceGrant = { scope: "@stackra-pro", names: ["@stackra-pro/sync"] };
 */
export interface RegistryLicenceGrant {
  /** The scope, `@stackra-pro` today; the registry refuses a scope whose read rule is not `licensed`. */
  readonly scope: string;

  /** `*` for every name of the scope, else the full names (`@stackra-pro/sync`, `@stackra-pro/skill-x`). */
  readonly names: "*" | readonly string[];
}
