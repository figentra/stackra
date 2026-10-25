/**
 * Stackra file contract:
 * Purpose: unit tests of `Publishable`, `Sluggable` and `Schedulable`: a new record is a draft with no times and an
 *          empty slug, and each trait is recorded on the model.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321 (decisions 2 and 6).
 */
import { HasPublicId, Model, Translated, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { PublicationStatus } from "#core/index";
import { HasRevisions } from "#node/traits/has-revisions.trait";
import { Publishable } from "#node/traits/publishable.trait";
import { Schedulable } from "#node/traits/schedulable.trait";
import { Sluggable } from "#node/traits/sluggable.trait";

class Page extends Model.with(
  HasPublicId("pag"),
  Publishable,
  Sluggable,
  HasRevisions,
  Schedulable,
) {}

describe("Publishable", () => {
  it("starts a draft with no times and an empty slug", () => {
    const page = new Page();
    expect(page.publicationStatus).toBe(PublicationStatus.Draft);
    expect(page.publishAt).toBeNull();
    expect(page.publishedAt).toBeNull();
    expect(page.slug).toBeInstanceOf(Translated);
    expect(page.slug.in("en")).toBe("");
    expect(traitsOf(Page).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "publishable",
      "sluggable",
      "has_revisions",
      "schedulable",
    ]);
  });
});
