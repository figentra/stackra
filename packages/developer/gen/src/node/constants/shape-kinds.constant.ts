/**
 * Stackra file contract:
 * Purpose: `SHAPE_KINDS`, the kind codes whose classes are shapes the shape compiler reads: wire shapes, event and
 *          signal payloads, models, settings groups, changes and configuration overrides.
 * Boundary: a frozen list. A configuration class is a shape only when it overrides a package's configuration (its
 *           fields replace defaults); `Config({ schema })` itself declares no field.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 26); ADR 0305 (rules 1, 14 and 34).
 */

/** The kind codes read as shapes. */
export const SHAPE_KINDS: readonly string[] = Object.freeze([
  "analytics_event",
  "change",
  "config",
  "domain_event",
  "integration_event",
  "model",
  "schema",
  "settings",
  "signal",
  "webhook_event",
]);
