/**
 * Stackra file contract:
 * Purpose: `TenancyScopes`, the scope level tenancy contributes as data: its key in the scope tree's levels and the
 *          settings cascade (`TenancyScopes.Tenant`, `tenant`).
 * Boundary: an `Enum.of` value plus the type of the same name. The only place the tenant level is named: the scope
 *           package ships `platform` and `product`, and every other package writes `TenancyScopes.Tenant` or speaks of a
 *           `ScopeRef` (ADR 0323 decisions 1 and 4, R-59). A node at this level is a tenant.
 * Runtime: isomorphic
 * Governing contract: ADR 0323 (decision 4); ADR 0327 (decisions 2 and 8); ADR 0213 (decision 2: the cascade order).
 */
import { Enum } from "@stackra/contracts";

/**
 * The levels tenancy contributes.
 *
 * @example
 * const isTenant = (entry: ScopeEntry) => entry.level === TenancyScopes.Tenant;
 */
export const TenancyScopes = Enum.of({
  /** A tenant: recursive, so a child tenant sits under its parent (an organisation). */
  Tenant: "tenant",
});

/** One of the codes above. */
export type TenancyScopes = Enum.Value<typeof TenancyScopes>;
