/**
 * Stackra file contract:
 * Purpose: `IDENTITY_KINDS`, the kind codes of the classes whose identity `stackra.manifest.json` locks from a class
 *          name or a written key (the derived identities table), which are the kinds the class form of `@Renamed` may
 *          mark.
 * Boundary: codes only, named like `SHAPE_KINDS` (the base class name in snake_case). A kind whose identity the
 *           manifest starts to lock is added here in the same change.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 5, 20 and 22); ADR 0231 (snake_case machine codes).
 */

/** The kind codes of classes with a locked identity. */
export const IDENTITY_KINDS: readonly string[] = Object.freeze([
  "action",
  "analytics_event",
  "block",
  "config",
  // gen locks a domain event's in-service name (`loyalty_kit.points_redeemed`) as it locks an integration event's.
  "domain_event",
  "flag",
  "integration_event",
  "model",
  "notification",
  "permissions",
  "query",
  "refusal",
  "role",
  "route",
  "schema",
  "seeder",
  "widget",
]);
