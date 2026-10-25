/**
 * Stackra file contract:
 * Purpose: `INTEGRATION_ROLES`, the five roles an Integration may declare in `roles` so its app-market listing can
 *          show them: `driver`, `channel`, `surface`, `connector` and `webhooks`. Gen copies them into the manifest's
 *          integration entry and refuses any other with `integration_role_unknown`.
 * Boundary: a frozen list of ADR vocabulary; which providers ship and how they are priced is data (the listing's
 *           entitlement reference), never this file.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decisions 1 and 2); ADR 0308 (rule 21: `listing.entitlement`).
 */

/** Every Integration role, in the order ADR 0355 lists them. */
export const INTEGRATION_ROLES: readonly string[] = Object.freeze([
  "driver",
  "channel",
  "surface",
  "connector",
  "webhooks",
]);
