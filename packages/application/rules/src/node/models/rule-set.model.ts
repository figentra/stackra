/**
 * Stackra file contract:
 * Purpose: `RuleSet`, a scope's rule as a versioned record: the scope it belongs to, the consumer whose fields it
 *          tests and, for a default seeded from a rule-set pack, the template key and seed version it came from; its
 *          conditions and outcomes are its revisions.
 * Boundary: data only. Key `rules.rule_set`, table `rules.rule_sets`, under forced row-level security on
 *           `scope_path`. `HasRevisions` keeps each condition as a frozen, numbered revision in `content.revisions`;
 *           the row itself holds no condition. A consumer's own record (a discount, a segment) links to it by id.
 *           Rows are added through `RuleSetService.open`, never with `new`; the ORM loads rows without running the
 *           constructor.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 5 and 10); ADR 0321 (decision 2: `HasRevisions`); ADR 0327 (decisions 3 and
 *                     9); ADR 0294 (decisions 4, 11, 20 and 27); ADR 0135 (public ids).
 */
import { HasRevisions } from "@stackra/content/node";
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** A rule set. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class RuleSet extends Model.with(HasPublicId("rset"), Timestamps, HasRevisions) {
  /** The scope node the rule set belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The key of the consumer whose `Rules` its conditions are checked against (`promotions.discount`). */
  consumer!: string;

  /** The rule-set pack template it was seeded from (`commerce.returns`); null for a tenant's own rule set. */
  seedKey: string | null = null;

  /** The pack version its last seeded revision came from; null for a tenant's own rule set. */
  seedVersion: string | null = null;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface RuleSet {
  [OptionalProps]?: "createdAt" | "updatedAt" | "seedKey" | "seedVersion";
}
