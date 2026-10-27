/**
 * Stackra file contract:
 * Purpose: `duration(text)`, the `Duration` value generated defaults write for a `Duration.*` initializer
 *          (`.default(duration("60s"))`): a short form (`"500ms"`, `"60s"`, `"5m"`, `"1h"`, `"2d"`) or an ISO 8601
 *          duration, read into the canonical `Duration`.
 * Boundary: the name gen emits, kept for generated code; it is `Duration.parse`, which reads the short form itself
 *           since stackra-223, so the parser lives once in @stackra/contracts. Authored code writes
 *           `Duration.seconds(60)` or `Duration.parse("60s")` instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `Duration.*` is a constant gen evaluates in defaults); owner D10
 *                     2026-10-28 (stackra-223: one duration parser).
 */
import { Duration } from "@stackra/contracts";

/**
 * The `Duration` that `text` spells.
 *
 * @throws RangeError when `text` is neither a short form nor an ISO 8601 duration of days, hours, minutes and seconds.
 * @example
 * duration("60s"); // "PT1M"
 * duration("PT600S"); // "PT10M"
 */
export function duration(text: string): Duration {
  return Duration.parse(text);
}
