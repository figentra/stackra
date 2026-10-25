/**
 * Stackra file contract:
 * Purpose: `factsOn`, the values in force for a resolved market on one date as a plain key-to-value record: the fact
 *          source a rules evaluation reads pack values from.
 * Boundary: pure. The caller places the record under its fact source key and converts any value a field type needs
 *           (money, dates); this package does not depend on the rules engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0331 (facts).
 */
import { valuesOn } from "#core/functions/values-on.function";
import type { PackValue } from "#core/types/pack-value.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/**
 * The facts of `resolved` on `on`.
 *
 * @example
 * evaluate(ruleSet, { market: factsOn(resolved, today), cart }, { now });
 */
export function factsOn(resolved: ResolvedPack, on: string): Readonly<Record<string, PackValue>> {
  return Object.fromEntries(
    [...valuesOn(resolved, on)].map(([key, resolvedValue]) => [key, resolvedValue.value]),
  );
}
