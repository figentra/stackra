/**
 * Stackra file contract:
 * Purpose: unit tests of `Sluggable`: the slug is a `Translated` per locale, made with `slugOf`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321 (decision 2).
 */
import { HasPublicId, Model, Translated } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { slugOf } from "#core/index";
import { Sluggable } from "#node/traits/sluggable.trait";

class Article extends Model.with(HasPublicId("art"), Sluggable) {}

describe("Sluggable", () => {
  it("holds one slug per locale", () => {
    const article = new Article();
    article.slug = Translated.of({ en: slugOf("Summer Sale"), ar: slugOf("تخفيضات الصيف") });
    expect(article.slug.in("ar-SA")).toBe("تخفيضات-الصيف");
    expect(article.slug.in("en-US")).toBe("summer-sale");
  });
});
