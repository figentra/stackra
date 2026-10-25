/**
 * Stackra file contract:
 * Purpose: `TENANT_ID_SETTING`, the transaction setting that carries the call's tenant (`app.tenant_id`): the
 *          generated equality policy of every tenant-owned table reads it, and `TenantIsolationService.withTenant`
 *          writes it.
 * Boundary: internal; one name for the writer and the reader. Unset or `''` matches no row (the database's compiled
 *           policy), so a forgotten `withTenant` returns zero rows.
 * Runtime: node
 * Governing contract: ADR 0239 (equality on `tenant_id`); `.agents/rules/tenancy.md` (points 1 and 2).
 */

/** The setting's name. */
export const TENANT_ID_SETTING = "app.tenant_id";
