/**
 * Stackra file contract:
 * Purpose: unit tests of `registerSearchableModels`: a `@Searchable` model is recorded by class name and its rows are
 *          watched with `SearchableChangeService`; registering it again changes nothing; a model without the facet and
 *          a second class of the same name are refused, and a refused batch records nothing.
 * Boundary: test only; the outbox's `registerChangeConsumers` is mocked, so the outbox's registry stays untouched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 5).
 */
import { Model, Searchable } from "@stackra/model";
import { registerChangeConsumers } from "@stackra/outbox";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { registerSearchableModels } from "#node/functions/register-searchable-models.function";
import { SearchableChangeService } from "#node/services/searchable-change.service";

vi.mock("@stackra/outbox", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  registerChangeConsumers: vi.fn(),
}));

/** A searchable model named `Article`. */
const ARTICLE = (() => {
  @Searchable({ text: ["title"] })
  class Article extends Model.with() {}
  return Article;
})();

/** Another searchable class named `Article`. */
const OTHER_ARTICLE = (() => {
  @Searchable({ text: ["body"] })
  class Article extends Model.with() {}
  return Article;
})();

class Plain extends Model.with() {}

afterEach(() => {
  SEARCHABLE_MODELS.clear();
  vi.mocked(registerChangeConsumers).mockClear();
});

describe("registerSearchableModels", () => {
  it("records the model and watches its rows", () => {
    registerSearchableModels([ARTICLE]);
    expect(SEARCHABLE_MODELS.get("Article")).toBe(ARTICLE);
    expect(registerChangeConsumers).toHaveBeenCalledWith([[ARTICLE, SearchableChangeService]]);
    expect(() => registerSearchableModels([ARTICLE])).not.toThrow();
    expect(SEARCHABLE_MODELS.size).toBe(1);
  });

  it("refuses a model without @Searchable and a second class of one name, recording nothing", () => {
    expect(() => registerSearchableModels([ARTICLE, Plain])).toThrow(/not @Searchable/);
    expect(() => registerSearchableModels([ARTICLE, OTHER_ARTICLE])).toThrow(/two models/);
    expect(SEARCHABLE_MODELS.size).toBe(0);
    expect(registerChangeConsumers).not.toHaveBeenCalled();
  });
});
