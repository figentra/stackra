/**
 * Stackra file contract:
 * Purpose: `strictestEffects`, the effects of a field that carries two classes (`@Classify` and `@Classified`): on each
 *          effect the stricter code of the two, so reading a field never loosens either class.
 * Boundary: pure, over codes and `DATA_CLASS_EFFECT_RANKS`. On a tie of rank (`delete` and `shred`) the first class's
 *           code stays, so an explicit `@Classify` choice holds.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 4: one effective class per field).
 */
import { DATA_CLASS_EFFECT_RANKS } from "#core/constants/data-class-effect-ranks.constant";
import type { DataClassEffects } from "#core/types/data-class-effects.type";

/**
 * Each effect's stricter code of `first` and `second`.
 *
 * @throws RangeError when either holds a code its effect does not rank.
 * @example
 * strictestEffects(clinicalNote, DATA_CLASSIFICATION_EFFECTS.health).encrypt; // "sealed" unless clinicalNote is stricter
 */
export function strictestEffects(
  first: Readonly<DataClassEffects>,
  second: Readonly<DataClassEffects>,
): DataClassEffects {
  const merged: Record<string, string> = {};
  for (const effect of Object.keys(DATA_CLASS_EFFECT_RANKS) as (keyof DataClassEffects)[]) {
    const ranks = DATA_CLASS_EFFECT_RANKS[effect] as Readonly<Record<string, number>>;
    const a = first[effect];
    const b = second[effect];
    if (!Object.hasOwn(ranks, a)) throw new RangeError(`"${String(a)}" is not a ${effect} effect`);
    if (!Object.hasOwn(ranks, b)) throw new RangeError(`"${String(b)}" is not a ${effect} effect`);
    merged[effect] = (ranks[b] as number) > (ranks[a] as number) ? b : a;
  }
  return merged as unknown as DataClassEffects;
}
