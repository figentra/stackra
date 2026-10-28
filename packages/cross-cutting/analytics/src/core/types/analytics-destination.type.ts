/**
 * Stackra file contract:
 * Purpose: `AnalyticsDestination`, one entry of `AnalyticsConfig.destinations`: which driver instance receives the
 *          deliveries (`default` is the `driver` field's instance, any other name a key of `drivers`), the consent
 *          category that gates that destination alone, and the event names it takes (`include`, empty for all) or
 *          never takes (`exclude`).
 * Boundary: a type only; the shipped schema checks it (category never `necessary`, each driver instance used once).
 *           `include` and `exclude` match whole event names and apply to tracked events only: `identify` and `group`
 *           reach every destination whose category is granted, so identity stitching stays whole.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); analytics gap 7 (stackra-407).
 */
import type { ConsentCategory } from "@stackra/consent";

/** One analytics destination. */
export interface AnalyticsDestination {
  /** `default` (the `driver` instance) or an instance name from `drivers`. */
  readonly driver: string;

  /** The consent category that must be granted before anything reaches this destination; never `necessary`. */
  readonly category: ConsentCategory;

  /** The event names this destination takes; empty or absent takes every event. */
  readonly include?: readonly string[];

  /** The event names this destination never takes; wins over `include`. */
  readonly exclude?: readonly string[];
}
