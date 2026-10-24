/**
 * Stackra file contract:
 * Purpose: `TENANT_SCOPE_LEVEL`, the tenant level as the data a deployment adds to `ScopeConfig.levels`: key `tenant`,
 *          recursive, so a child tenant sits under its parent and an organisation is a parent tenant.
 * Boundary: a constant only. Levels are data (ADR 0327 d2): the deployment appends this to the scope package's
 *           defaults in its `ScopeConfig` override, after `product`, and no code or migration changes. Adding it is
 *           what makes a node a tenant; tenancy never edits the scope package's defaults.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2, 4 and 8); ADR 0210 (decision 1: the recursive tenant tree); ADR 0243
 *                     (organisations are parent tenants).
 */
import type { ScopeLevel } from "@stackra/scope/contracts";

import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";

/**
 * The tenant level.
 *
 * @example
 * // src/config/scope.config.ts of a deployment
 * export class ScopeConfig extends BaseScopeConfig {
 *   override levels = [...this.levels, TENANT_SCOPE_LEVEL];
 *   override aliases = { ...this.aliases, [TenancyScopes.Tenant]: TENANT_SCOPE_ALIAS };
 * }
 */
export const TENANT_SCOPE_LEVEL: ScopeLevel = Object.freeze({
  key: TenancyScopes.Tenant,
  recursive: true,
});
