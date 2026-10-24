/**
 * Stackra file contract:
 * Purpose: `TENANT_SCOPE_ALIAS`, the lang key of the tenant level's display name (`tenancy::levels.tenant`), which a
 *          deployment sets in `ScopeConfig.aliases` beside `TENANT_SCOPE_LEVEL`.
 * Boundary: a constant only; the text is in this package's catalogues (`assets/lang/{en,ar}/tenancy.json`). The scope
 *           package's catalogues hold no tenant label (R-59), so the level needs this alias, or one of the deployment's
 *           own (an organisation, ADR 0327 d4).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 4); naming rule (namespace lookups `<module>::<path>`).
 */

/**
 * The tenant level's lang key.
 *
 * @example
 * scopeLevelLabel({ aliases: { [TenancyScopes.Tenant]: TENANT_SCOPE_ALIAS } }, TenancyScopes.Tenant);
 * // "tenancy::levels.tenant"
 */
export const TENANT_SCOPE_ALIAS = "tenancy::levels.tenant";
