/**
 * Stackra file contract:
 * Purpose: `Publishable`, the trait of a model whose records are drafted, scheduled and published: the publication
 *          state, the time a scheduled record goes live, and when it last went live.
 * Boundary: adds the fields only (`publication_status`, `publish_at`, `published_at` in the model's migration). A
 *           reader checks liveness with `isPublished`; the scheduler only fires the flip at `publishAt` (ADR 0321
 *           decision 6). A record whose content itself is scheduled as a future revision is `Schedulable`.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 2: owned by @stackra/content); ADR 0294 (decision 27).
 */
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

import { PublicationStatus } from "#core/index";

/**
 * The publishable trait.
 *
 * @example
 * export class Page extends Model.with(HasPublicId("pag"), Publishable, Sluggable) {}
 */
export const Publishable: Trait<{
  publicationStatus: PublicationStatus;
  publishAt: Date | null;
  publishedAt: Date | null;
}> = createTrait(
  "publishable",
  (base) =>
    class extends base {
      /** The publication state; a new record is a draft. */
      publicationStatus: PublicationStatus = PublicationStatus.Draft;

      /** When a scheduled record goes live; null unless scheduled. */
      publishAt: Date | null = null;

      /** When the record last went live; null while it never has. */
      publishedAt: Date | null = null;
    },
);
