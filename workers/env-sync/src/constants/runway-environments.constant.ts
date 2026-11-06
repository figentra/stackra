/**
 * Stackra file contract:
 * Purpose: the Infisical environment slug to Runway environment map the webhook dispatches with.
 * Boundary: a constant only; any other slug is refused with 400.
 * Runtime: worker
 * Governing contract: ADR 0173 (amendment of 2026-11-04, decisions 3 and 6); the root runway's
 *                     `providers.infisical.environments`.
 */

/** Infisical slug to Runway environment; `preview` reads `dev` and is never dispatched on its own. */
export const RUNWAY_ENVIRONMENTS: ReadonlyMap<string, string> = new Map([
  ["dev", "dev"],
  ["staging", "staging"],
  ["prod", "production"],
]);
