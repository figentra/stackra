/**
 * Stackra file contract:
 * Purpose: `floorsOn`, the legal floors in force for a resolved market on one date, each with its bound, its law and
 *          the pack that set it: what the settings resolver refuses to cross and the rules engine checks last.
 * Boundary: pure; the floors are pack data, the check that applies them belongs to the settings resolver and the rules
 *           engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 6); ADR 0363 (decision 4).
 */
import { valuesOn } from "#core/functions/values-on.function";
import type { ResolvedPack } from "#core/types/resolved-pack.type";
import type { ResolvedValue } from "#core/types/resolved-value.type";

/**
 * The floors of `resolved` on `on`.
 *
 * @example
 * for (const floor of floorsOn(resolved, today)) settingsFloor(floor.key, floor.value, floor.floor);
 */
export function floorsOn(resolved: ResolvedPack, on: string): readonly ResolvedValue[] {
  return [...valuesOn(resolved, on).values()].filter((value) => value.floor !== undefined);
}
