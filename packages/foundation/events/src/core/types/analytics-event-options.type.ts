/**
 * Stackra file contract:
 * Purpose: `AnalyticsEventOptions`, what `AnalyticsEvent({...})` takes: the event's name, written once.
 * Boundary: a type only; gen locks the name in `stackra.manifest.json`, and `@stackra/analytics` sends it under that
 *           name once consent allows.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 19 and 20); ADR 0298 (decision 5).
 */

/** The options of an analytics event. */
export interface AnalyticsEventOptions {
  /** The name, dotted snake_case (`lead.submitted`). */
  readonly name: string;
}
