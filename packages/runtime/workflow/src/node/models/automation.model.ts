/**
 * Stackra file contract:
 * Purpose: `Automation`, a scope's automation as a versioned record: its document key, and, once published, the
 *          revision in force, the trigger block it listens to and the principal it runs as; the revision a dry run
 *          last covered; and, for a default seeded from a workflow template pack, the seed version. Its documents are
 *          its revisions.
 * Boundary: data only. Key `workflow.automation`, table `workflow.automations`, under forced row-level security on
 *           `scope_path`. `HasRevisions` keeps each document as a frozen, numbered revision in `content.revisions`; the
 *           row holds only what the trigger lookup and the publish check need. Rows are added through
 *           `AutomationService`, never with `new`; the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 2: an automation runs as its own principal); ADR 0270
 *                     (decisions 2 and 6); ADR 0321 (decision 2: `HasRevisions`); ADR 0327 (decisions 3 and 9); ADR
 *                     0294 (decisions 4, 11, 20 and 27).
 */
import { HasRevisions } from "@stackra/content/node";
import type { Actor, PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** An automation. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Automation extends Model.with(HasPublicId("wfa"), Timestamps, HasRevisions) {
  /** The scope node the automation belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The key every revision's document carries (`commerce.cod_confirmation`). */
  key!: string;

  /** The trigger block of the published revision; null while unpublished or for a document without one. */
  trigger: string | null = null;

  /** The revision in force; null until published. */
  publishedRevision: number | null = null;

  /** The revision a dry run last covered, which is the one that may be published. */
  dryRunRevision: number | null = null;

  /** The principal the published automation runs as, never more than its publisher (ADR 0153). */
  principal: Actor | null = null;

  /** The workflow template pack version it was last seeded from; null for a tenant's own automation. */
  seedVersion: string | null = null;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the defaulted
// fields out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Automation {
  [OptionalProps]?:
    | "createdAt"
    | "updatedAt"
    | "trigger"
    | "publishedRevision"
    | "dryRunRevision"
    | "principal"
    | "seedVersion";
}
