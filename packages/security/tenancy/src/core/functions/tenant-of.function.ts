/**
 * Stackra file contract:
 * Purpose: `tenantOf(tree, scope)`, the tenant a scope belongs to: the scope itself when it sits at the tenant level,
 *          otherwise its nearest ancestor at that level (tenants are recursive, so a branch of a child tenant belongs
 *          to the child).
 * Boundary: reads the scope tree only. A scope above every tenant (the platform, a product) has none: `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 8: a tenant is the scope node at the tenant level); ADR 0210 (recursive
 *                     tenants); stackra-310.
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { ScopeTree } from "@stackra/scope/contracts";

import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";

/**
 * The id of the tenant `scope` belongs to.
 *
 * @example
 * await tenantOf(tree, { id: branchId, path: "platform.acme.shop_eu.riyadh" }); // the shop_eu tenant's id
 */
export async function tenantOf(
  tree: ScopeTree,
  scope: ScopeRef,
): Promise<PublicId<"scp"> | undefined> {
  const self = await tree.node(scope.id as PublicId<"scp">);
  if (self?.level === TenancyScopes.Tenant) return self.id as PublicId<"scp">;
  const ancestors = await tree.ancestors(scope);
  // root first, so the nearest tenant is the last one (findLast is ES2023; the base lib is ES2022)
  for (let index = ancestors.length - 1; index >= 0; index -= 1)
    if (ancestors[index]?.level === TenancyScopes.Tenant)
      return ancestors[index]?.id as PublicId<"scp">;
  return undefined;
}
