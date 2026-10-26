/**
 * Stackra file contract:
 * Purpose: `CatalogueModule`, one paid module of a product's plan catalogue, sold as an add-on in the app market or
 *          included by a tier.
 * Boundary: a type only; catalogue data. Its key is the module entitlement's key.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); ADR 0215 (decision 1: module entitlements).
 */

/** A module. */
export interface CatalogueModule {
  /** The module entitlement's key (`payroll`). */
  readonly key: string;
}
