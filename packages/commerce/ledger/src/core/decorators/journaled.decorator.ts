/**
 * Stackra file contract:
 * Purpose: `@Journaled(options)`, the class facet that makes a model a journal's entry model: which of its fields hold
 *          the account, amount, kind, reference, time and currency, and the default balance floor of its accounts.
 * Boundary: made with `createDecorator`, so it records metadata only; one per model, models only. `Journal` reads it
 *           with `Journaled.on(model)` when it runs; nothing acts on it at boot, so the package has no Explorer (as
 *           `@Searchable` in @stackra/model). Gen checks the field names against the model.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 6: class facets made with `createDecorator`); ADR 0220 (decision 4).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { DecoratorFunction } from "@stackra/container";

import type { JournaledOptions } from "#core/types/journaled-options.type";

/** The recording decorator; `Journaled` checks and freezes its options. */
const JOURNALED = createDecorator<JournaledOptions>({
  kind: "journaled",
  target: DecoratorTarget.Class,
  kinds: ["model"],
});

/**
 * Declares the journal fields and floor of an entry model.
 *
 * @throws RangeError when `options.floor` is not a safe integer; at class definition, TypeError when applied to
 *         anything but a model class.
 * @example
 * ```ts
 * @Journaled({ account: "memberId", amount: "points", floor: 0 })
 * export class LedgerEntry extends Model.with(HasPublicId("lpe"), BelongsToTenant, AppendOnly) {}
 * ```
 */
export function Journaled(options: JournaledOptions): DecoratorFunction {
  if (options.floor !== undefined && !Number.isSafeInteger(options.floor))
    throw new RangeError(`@Journaled: the floor is a safe integer, not ${options.floor}`);
  return JOURNALED(Object.freeze({ ...options }));
}

/** The options declared on a model or its nearest decorated ancestor; undefined when it has none. */
Journaled.on = JOURNALED.on;
