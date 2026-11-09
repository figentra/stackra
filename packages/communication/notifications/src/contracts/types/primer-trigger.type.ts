/**
 * Stackra file contract:
 * Purpose: `PrimerTrigger`, the moment the push primer is shown, named by the host in snake_case (`onboarding`,
 *          `first_order`, `settings`).
 * Boundary: a type only. `PushPrimer` passes it to `PushRegistration.register`, so the service can record why a device
 *           was registered; it never changes what the primer shows.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0231 (machine codes are snake_case).
 */

/** Why the push primer is showing, as the host names it. */
export type PrimerTrigger = string;
