/**
 * Stackra file contract:
 * Purpose: unit tests of `@Collaborative`: it records its view and edit permissions on the model and registers the model
 *          under its public-id prefix; it refuses a class that is not a model and a model without `HasPublicId`.
 * Boundary: test only; test models made with `Model.with`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decision 3).
 */
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { COLLABORATIVE_MODELS } from "#node/constants/collaborative-models.constant";
import { Collaborative } from "#node/decorators/collaborative.decorator";

describe("Collaborative", () => {
  it("records the permissions and registers the model by its prefix", () => {
    @Collaborative({
      view: "docs.sheet.read",
      edit: "docs.sheet.update",
    })
    class Sheet extends Model.with(HasPublicId("sht")) {}

    expect(Collaborative.on(Sheet)).toEqual({ view: "docs.sheet.read", edit: "docs.sheet.update" });
    expect(COLLABORATIVE_MODELS.get("sht")).toEqual({
      model: Sheet,
      view: "docs.sheet.read",
      edit: "docs.sheet.update",
    });
  });

  it("refuses a class that is not a model and a model without a public id", () => {
    const options = { view: "docs.sheet.read", edit: "docs.sheet.update" };
    class Plain {}
    expect(() => Collaborative(options)(Plain)).toThrow(TypeError);
    class Keyless extends Model.with() {}
    expect(() => Collaborative(options)(Keyless)).toThrow(/needs HasPublicId/);
  });
});
