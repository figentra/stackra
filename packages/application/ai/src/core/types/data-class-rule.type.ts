/**
 * Stackra file contract:
 * Purpose: `DataClassRule`, how calls carrying one data class may route: in-region only, zero-retention only, and the
 *          providers the tenant enabled for the class.
 * Boundary: a type only; product and tenant data. Special-category and privileged classes reach a model only through a
 *           provider the tenant enabled for that class that is in-region and keeps nothing; an empty `providers` list
 *           closes the class to every model. A class with no rule routes like any call.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 15); ADR 0341 (product-defined data classes and the privileged class).
 */

/** One data class's routing rule. */
export interface DataClassRule {
  /** The data class (`health`, `privileged`). */
  readonly dataClass: string;

  /** Whether the call must stay in the tenant's region. */
  readonly inRegionOnly: boolean;

  /** Whether only zero-retention providers may take it. */
  readonly zeroRetentionOnly: boolean;

  /** The provider keys the tenant enabled for the class; every provider when absent. */
  readonly providers?: readonly string[];
}
