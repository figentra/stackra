/**
 * Stackra file contract:
 * Purpose: unit tests of `CATALOGUE_ITEM_SCHEMA` and `CATALOGUE_PAGE_SCHEMA`: a full item and a page parse, an item
 *          with an unknown access or kind is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 12).
 */
import { describe, expect, it } from "@stackra/testing";

import { CATALOGUE_ITEM_SCHEMA } from "#contracts/constants/catalogue-item-schema.constant";
import { CATALOGUE_PAGE_SCHEMA } from "#contracts/constants/catalogue-page-schema.constant";

const item = {
  name: "@stackra/skill-archify",
  scope: "@stackra",
  kind: "skill",
  description: "Diagram renderers",
  latest: "0.1.0",
  distTags: { latest: "0.1.0" },
  access: "open",
  licence: "Apache-2.0",
  keywords: [],
  repository: null,
  homepage: null,
  publishedAt: "2026-10-27T00:00:00.000Z",
  deprecated: null,
  stackra: { kind: "skill" },
};

describe("CATALOGUE_ITEM_SCHEMA", () => {
  it("parses an item, with or without versions", () => {
    expect(CATALOGUE_ITEM_SCHEMA.parse(item)).toEqual(item);
    expect(CATALOGUE_ITEM_SCHEMA.parse({ ...item, versions: ["0.1.0"] }).versions).toEqual([
      "0.1.0",
    ]);
  });

  it("refuses an unknown access or kind", () => {
    expect(CATALOGUE_ITEM_SCHEMA.safeParse({ ...item, access: "public" }).success).toBe(false);
    expect(CATALOGUE_ITEM_SCHEMA.safeParse({ ...item, kind: "theme" }).success).toBe(false);
  });
});

describe("CATALOGUE_PAGE_SCHEMA", () => {
  it("parses a last page", () => {
    expect(CATALOGUE_PAGE_SCHEMA.parse({ items: [item], next: null })).toEqual({
      items: [item],
      next: null,
    });
  });
});
