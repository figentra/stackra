/**
 * Stackra file contract:
 * Purpose: `SHAPE_KINDS`, the kind codes of the classes whose fields gen compiles to a shape (the kind table rows that
 *          hold data fields), which are the kinds the field decorators (`@Str`, `@Int`, `@Num`, `@List`, `@Trim`,
 *          `@Field`, `@Classified`, the field form of `@Renamed`) may mark.
 * Boundary: codes only; each kind package registers its own code with its base, and the code is the base class name in
 *           snake_case (`Refusal` is `refusal`, `IntegrationEvent` is `integration_event`). A kind package that adds a
 *           field-carrying kind adds its code here in the same change.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6, 16 and 26); ADR 0231 (snake_case machine codes).
 */

/** The kind codes of field-carrying classes. */
export const SHAPE_KINDS: readonly string[] = Object.freeze([
  "analytics_event",
  "block",
  "change",
  "config",
  "domain_event",
  "integration_event",
  "model",
  "projection",
  "refusal",
  "schema",
  "settings",
  "signal",
  "store",
  "webhook_event",
]);
