/**
 * Stackra file contract:
 * Purpose: `SERVICE_ROLE`, the name of the task guides' service role: `NOLOGIN NOBYPASSRLS`, owning nothing, as a
 *          deployed service's database user is.
 * Boundary: test support only, under `scripts/guides`; `createServiceRole` makes it, `asServiceRole` switches to it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239; ADR 0347 (decision 5); STA-2843.
 */

/** The role's name. */
export const SERVICE_ROLE = "guide_service";
