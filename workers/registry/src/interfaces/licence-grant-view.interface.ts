/**
 * Stackra file contract:
 * Purpose: `LicenceGrantView`: one grant: the names of a scope a licence may read (`*` for every name).
 * Boundary: type only; the same shape as `RegistryLicenceGrant` of `@stackra/licensing/contracts`, which the
 *           licence API answers. `grantsOf` (src/licence) folds `licence_grants` rows into it.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 10 and 13); stackra-183 (STA-1335).
 */

/** One grant: the names of a scope a licence may read (`*` for every name). */
export interface LicenceGrantView {
  /** The scope the grant covers. */
  readonly scope: string;
  /** The package names of that scope the licence may read, or `*` for all of them. */
  readonly names: "*" | readonly string[];
}
