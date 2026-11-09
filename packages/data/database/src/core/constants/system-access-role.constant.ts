/**
 * Stackra file contract:
 * Purpose: `SYSTEM_ACCESS_ROLE`, the role a system lookup or claim reads tenant tables as before a tenant is known (a
 *          provider webhook finding an id's tenant, the outbox relay or the queue worker claiming due rows): `NOLOGIN`,
 *          `NOBYPASSRLS` and no member, so no session can become it. It reaches a table only through the column grants
 *          and role-scoped policies of `t.systemAccess`, and only by running a `schema.systemFunction` it owns.
 * Boundary: data only. Postgres roles belong to the cluster, so each database's migrations create it when missing and
 *           every grant to it is that database's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A: cross-tenant system workers).
 */

/** The system-access role's name. */
export const SYSTEM_ACCESS_ROLE = "stackra_system_access";
