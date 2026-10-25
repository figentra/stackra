/**
 * Stackra file contract:
 * Purpose: `HasRevisions`, the trait of a model whose records keep numbered revisions, each a draft until it is
 *          published.
 * Boundary: adds no field and no column: the revisions live in the side table `content.revisions`, keyed by the model
 *           key and the record's public id, one frozen snapshot per number. The owning package writes and reads them
 *           through `Repository<Revision>`; the trait is recorded in the trait registry so gen can find the models
 *           that keep revisions. `Publishable`, `Schedulable` and their states are later traits.
 * Runtime: node
 * Governing contract: ADR 0321 (decisions 2 and 6: owned by @stackra/content); ADR 0116 (decision CT3); ADR 0096
 *                     (decision 2: `Has*` owns data); ADR 0294 (decision 27).
 */
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The revisions trait.
 *
 * @example
 * export class RuleSet extends Model.with(HasPublicId("rset"), Timestamps, HasRevisions) {}
 */
export const HasRevisions: Trait = createTrait("has_revisions", (base) => class extends base {});
