/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchForgetService`: a registered model's rows leave the search index, a semantic model's
 *          also leave the vector index under their passage ids; an unregistered model, or no ids, touches nothing.
 * Boundary: test only; the search reader and the vector index are stand-ins recording calls, and the registry entries
 *           are set directly and cleared after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 7); ADR 0189 (decision 2).
 */
import { Service } from "@stackra/container";
import { Model, Searchable } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { VectorIndex } from "#contracts/index";
import type { Search } from "#core/index";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { SearchForgetService } from "#node/services/search-forget.service";

@Searchable({ text: ["title"] })
class Article extends Model.with() {}

@Searchable({
  text: ["body"],
  semantic: true,
})
class CaseNote extends Model.with() {}

/** A service over stand-ins. */
function setup() {
  const index = { remove: vi.fn(async () => undefined) };
  const search = { in: vi.fn(() => index) } as unknown as Search;
  const vectors = { remove: vi.fn(async () => undefined) };
  const service = new SearchForgetService(search, vectors as unknown as VectorIndex);
  return { index, search, vectors, service };
}

afterEach(() => {
  SEARCHABLE_MODELS.clear();
});

describe(SearchForgetService, () => {
  it("is a service", () => {
    expect(setup().service).toBeInstanceOf(Service);
  });

  it("removes a registered model's documents and keeps the vector index for a non-semantic one", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { index, search, vectors, service } = setup();
    await service.forget(Article, ["art_1", "art_2"]);
    expect(search.in).toHaveBeenCalledWith(Article);
    expect(index.remove).toHaveBeenCalledWith(["art_1", "art_2"]);
    expect(vectors.remove).not.toHaveBeenCalled();
  });

  it("removes a semantic model's passages too", async () => {
    SEARCHABLE_MODELS.set("CaseNote", CaseNote);
    const { index, vectors, service } = setup();
    await service.forget(CaseNote, ["cnt_1"]);
    expect(index.remove).toHaveBeenCalledWith(["cnt_1"]);
    expect(vectors.remove).toHaveBeenCalledWith(["CaseNote:cnt_1"]);
  });

  it("ignores an unregistered model and an empty list", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { search, vectors, service } = setup();
    await service.forget(CaseNote, ["cnt_1"]);
    await service.forget(Article, []);
    expect(search.in).not.toHaveBeenCalled();
    expect(vectors.remove).not.toHaveBeenCalled();
  });
});
