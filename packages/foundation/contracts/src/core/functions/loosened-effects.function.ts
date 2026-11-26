/**
 * Stackra file contract:
 * Purpose: `loosenedEffects`, the effects on which a data class is looser than a floor: what gen names when a field's
 *          `@Classify` class would weaken the `@Classified` class it also carries, and what a product class may never
 *          do to a built-in row.
 * Boundary: pure, over codes and `DATA_CLASS_EFFECT_RANKS`; an effect missing from `candidate` counts as loosened.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 3: a class never loosens its floor); ADR 0380 (decision 3).
 */
import { DATA_CLASS_EFFECT_RANKS } from "#core/constants/data-class-effect-ranks.constant";
import type { DataClassEffects } from "#core/types/data-class-effects.type";

/** The rank of `code` in `effect`'s order; undefined for a code the order does not hold. */
function rankOf(effect: keyof DataClassEffects, code: unknown): number | undefined {
  const ranks = DATA_CLASS_EFFECT_RANKS[effect] as Readonly<Record<string, number>>;
  return typeof code === "string" && Object.hasOwn(ranks, code) ? ranks[code] : undefined;
}

/**
 * The effects of `candidate` that rank below `floor`'s, in the order of `DATA_CLASS_EFFECT_RANKS`.
 *
 * @param candidate - the effects to check, possibly partial (a product class gen read from source).
 * @param floor - the effects they must not go below.
 * @throws RangeError when `floor` holds a code its effect does not rank.
 * @example
 * loosenedEffects({ ...DATA_CLASSIFICATION_EFFECTS.health, encrypt: "clear" }, DATA_CLASSIFICATION_EFFECTS.health);
 * // ["encrypt"]
 */
export function loosenedEffects(
  candidate: Partial<Readonly<Record<keyof DataClassEffects, unknown>>>,
  floor: Readonly<DataClassEffects>,
): (keyof DataClassEffects)[] {
  const loosened: (keyof DataClassEffects)[] = [];
  for (const effect of Object.keys(DATA_CLASS_EFFECT_RANKS) as (keyof DataClassEffects)[]) {
    const least = rankOf(effect, floor[effect]);
    if (least === undefined)
      throw new RangeError(`"${String(floor[effect])}" is not a ${effect} effect`);
    const rank = rankOf(effect, candidate[effect]);
    if (rank === undefined || rank < least) loosened.push(effect);
  }
  return loosened;
}
