/**
 * Stackra file contract:
 * Purpose: `Retention({ keep, basis, policy })`, the trait of a model whose rows expire: once a row's `basis` date is
 *          older than `keep`, the daily `record.prune` job archives, soft-deletes or deletes it.
 * Boundary: a marker with options: it adds no field (the `basis` field is the model's own; `archive` and `soft` need
 *           the `Archivable` or `SoftDeletes` trait, which the job checks). @stackra/database's `pruneRecords` reads
 *           the options; a hard delete asks the `HoldRegistry` with `Disposal.Retention`.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decision 3); ADR 0189 (decision 4); ADR 0096 (decision 1); ADR 0294 (decision 27);
 *                     data-layer gaps gov4 and mo27.
 */
import { Duration } from "@stackra/contracts";

import { createTrait } from "#core/functions/create-trait.function";
import type { RetentionOptions } from "#core/types/retention-options.type";
import type { Trait } from "#core/types/trait.type";

/** The policies an expired row may take. */
const POLICIES = new Set(["archive", "soft", "hard"]);

/**
 * The retention trait.
 *
 * @throws TypeError for an unknown policy, an empty `basis` or a `keep` that is not longer than zero.
 * @example
 * export class AiThread extends Model.with(
 *   HasPublicId("thr"),
 *   SoftDeletes,
 *   Retention({ keep: Duration.days(90), basis: "createdAt", policy: "soft" }),
 * ) {}
 */
export function Retention(options: RetentionOptions): Trait<object> {
  if (!POLICIES.has(options.policy))
    throw new TypeError(`"${options.policy}" is not a retention policy (archive, soft, hard)`);
  if (options.basis === "")
    throw new TypeError("Retention needs the basis field a row's age is read from");
  if (Duration.toMilliseconds(options.keep) <= 0)
    throw new TypeError("Retention keeps a row for longer than zero");
  return createTrait("retention", (base) => class extends base {}, { ...options });
}
