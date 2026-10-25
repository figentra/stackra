/**
 * Stackra file contract:
 * Purpose: `Sluggable`, the trait of a model whose records are addressed by a slug per locale (`/ar-sa/<slug>`).
 * Boundary: adds the field only: `slug`, a `Translated` value keyed by locale, made with `slugOf`. Uniqueness per
 *           locale is the model's unique index on the locale's value; which locales a record needs is the tenant's
 *           language settings, never this trait.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 2: `Sluggable`, owned by @stackra/content); ADR 0297 (locale URL prefixes).
 */
import { createTrait, Translated } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The sluggable trait.
 *
 * @example
 * page.slug = Translated.of({ en: slugOf(title.in("en")), ar: slugOf(title.in("ar")) });
 */
export const Sluggable: Trait<{ slug: Translated }> = createTrait(
  "sluggable",
  (base) =>
    class extends base {
      /** The record's slug in each locale. */
      slug: Translated = Translated.of({});
    },
);
