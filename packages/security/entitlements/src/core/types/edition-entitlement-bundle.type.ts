/**
 * Stackra file contract:
 * Purpose: `EditionEntitlementBundle`, the base module entitlements an edition sells with its own plan ladder: the
 *          base product key, the module entitlement keys every tier includes, and those only some tiers include.
 * Boundary: a type only; catalogue data of the edition, kept beside its `plan-catalogue:<edition>` version, never
 *           code. A base entitlement it does not list is not available to the edition's scopes.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 6); ADR 0215 (decision 1: module entitlements); ADR 0242.
 */

/** The base entitlements an edition bundles. */
export interface EditionEntitlementBundle {
  /** The base product key (`commerce`). */
  readonly of: string;

  /** Base module entitlement keys every tier includes. */
  readonly modules: readonly string[];

  /** Tier key to the base module entitlement keys only that tier adds. */
  readonly tiers?: Readonly<Record<string, readonly string[]>>;
}
