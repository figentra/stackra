/**
 * Stackra file contract:
 * Purpose: `millisecondsOf(value)`, the length a duration operand holds (`"30d"`, `"12h"`, `"PT15M"`), or `undefined`
 *          when the value is not a positive duration.
 * Boundary: internal to the package; it reads durations as `@stackra/validation`'s `duration` does, so a user may
 *           write the short form the rule builder offers and the engine stores it as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 3 and 6); ADR 0294 (decision 26: `Duration`).
 */
import { Duration } from "@stackra/contracts";
import { duration } from "@stackra/validation";

/** The longest duration text read; anything longer is refused before parsing. */
const MAX_LENGTH = 32;

/** Milliseconds above zero, or `undefined`. */
export function millisecondsOf(value: unknown): number | undefined {
  if (typeof value !== "string" || value.length > MAX_LENGTH) return undefined;
  try {
    const milliseconds = Duration.toMilliseconds(duration(value));
    return milliseconds > 0 ? milliseconds : undefined;
  } catch {
    return undefined;
  }
}
