/**
 * Stackra file contract:
 * Purpose: `CapturesChanges({ values?, exclude? })`, the trait of a model whose row changes enter the outbox change
 *          feed: every committed create, update and delete of its rows is kept in `outbox.changes`, whether or not a
 *          consumer watches it yet, so a later consumer can replay the retained window.
 * Boundary: a marker with options: it adds no field. @stackra/outbox's flush writer reads it through
 *           `changeCaptureOf`; consumers declare themselves with `@ConsumesChanges(Model)` and gen registers them.
 *           Values are opt-in, and encrypted and `@Classified` fields never carry one.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps cdc1 and cdc2; ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0096
 *                     (decision 1); ADR 0294 (decision 27).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { CapturesChangesOptions } from "#core/types/captures-changes-options.type";
import type { Trait } from "#core/types/trait.type";

/**
 * The change-capture trait.
 *
 * @throws TypeError when `exclude` names a field twice.
 * @example
 * export class Product extends Model.with(HasPublicId("prd"), CapturesChanges({ values: true, exclude: ["cost"] })) {}
 */
export function CapturesChanges(options: CapturesChangesOptions = {}): Trait<object> {
  const exclude = options.exclude ?? [];
  if (new Set(exclude).size !== exclude.length)
    throw new TypeError(`CapturesChanges excludes a field twice: ${exclude.join(", ")}`);
  return createTrait("captures_changes", (base) => class extends base {}, {
    values: options.values === true,
    exclude: Object.freeze([...exclude]),
  });
}
