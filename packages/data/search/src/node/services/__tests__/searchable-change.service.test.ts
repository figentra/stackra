/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchableChangeService`: a created or updated row of a registered model is loaded and
 *          indexed; a deleted row, and a row the session no longer finds, leaves the index; a change of a model nobody
 *          registered is ignored; a run of changes is one load and one index call; an update of no indexed field is
 *          skipped unless it changes the row's presence.
 * Boundary: test only; the search reader and the database are stand-ins recording calls, and the registry entry is
 *           set directly and cleared after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 5); ADR 0078 (decision 4); data-layer gap se3.
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Model, Searchable } from "@stackra/model";
import { RowChangeKind } from "@stackra/outbox/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { Search } from "#core/index";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { SearchableChangeService } from "#node/services/searchable-change.service";

@Searchable({
  text: ["title", "tags.name"],
  filters: ["status"],
})
class Article extends Model.with() {}

const ROW = { id: "art_01j9z3k4m5n6p7q8r9s0t1v2w1" };
const OTHER = { id: "art_01j9z3k4m5n6p7q8r9s0t1v2w2" };

/** A service over stand-ins; `found` is what the database finds. */
function setup(found: readonly object[]) {
  const index = { index: vi.fn(async () => undefined), remove: vi.fn(async () => undefined) };
  const search = { in: vi.fn(() => index) } as unknown as Search;
  const find = vi.fn(async () => found);
  const database = {
    em: () => ({ find, getMetadata: () => ({ primaryKeys: ["id"] }) }),
  } as unknown as Database;
  return { index, search, find, service: new SearchableChangeService(search, database) };
}

afterEach(() => {
  SEARCHABLE_MODELS.clear();
});

describe(SearchableChangeService, () => {
  it("is a service", () => {
    expect(setup([]).service).toBeInstanceOf(Service);
  });

  it("loads and indexes a created or updated row", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { index, search, find, service } = setup([ROW]);
    for (const kind of [RowChangeKind.Created, RowChangeKind.Updated])
      await service.consume({ model: "Article", id: ROW.id, kind, fields: ["title"] });
    expect(search.in).toHaveBeenCalledWith(Article);
    expect(find).toHaveBeenCalledWith(Article, { id: { $in: [ROW.id] } });
    expect(index.index).toHaveBeenCalledTimes(2);
    expect(index.index).toHaveBeenCalledWith([ROW]);
    expect(index.remove).not.toHaveBeenCalled();
  });

  it("removes a deleted row without loading it, and a row the session no longer finds", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { index, find, service } = setup([]);
    await service.consume({
      model: "Article",
      id: ROW.id,
      kind: RowChangeKind.Deleted,
      fields: [],
    });
    expect(find).not.toHaveBeenCalled();
    await service.consume({
      model: "Article",
      id: ROW.id,
      kind: RowChangeKind.Updated,
      fields: ["title"],
    });
    expect(index.remove).toHaveBeenCalledTimes(2);
    expect(index.remove).toHaveBeenCalledWith([ROW.id]);
    expect(index.index).not.toHaveBeenCalled();
  });

  it("ignores a change of a model nobody registered", async () => {
    const { search, find, service } = setup([ROW]);
    await service.consume({ model: "Order", id: "ord_1", kind: RowChangeKind.Created, fields: [] });
    expect(search.in).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it("loads a run in one query and indexes it in one call, removing the rows gone", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { index, find, service } = setup([ROW]);
    await service.consumeMany([
      { model: "Article", id: ROW.id, kind: RowChangeKind.Updated, fields: ["status"] },
      { model: "Article", id: OTHER.id, kind: RowChangeKind.Created, fields: ["title"] },
      { model: "Article", id: "art_gone", kind: RowChangeKind.Deleted, fields: [] },
    ]);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith(Article, { id: { $in: [ROW.id, OTHER.id] } });
    expect(index.index).toHaveBeenCalledExactlyOnceWith([ROW]);
    expect(index.remove).toHaveBeenCalledExactlyOnceWith([OTHER.id, "art_gone"]);
  });

  it("skips an update of no indexed field, but not one of a relation path, a presence field or no field", async () => {
    SEARCHABLE_MODELS.set("Article", Article);
    const { find, service } = setup([ROW]);
    await service.consume({
      model: "Article",
      id: ROW.id,
      kind: RowChangeKind.Updated,
      fields: ["viewCount"],
    });
    expect(find).not.toHaveBeenCalled();
    for (const fields of [["tags"], ["deletedAt"], ["scopePath"], []])
      await service.consume({ model: "Article", id: ROW.id, kind: RowChangeKind.Updated, fields });
    expect(find).toHaveBeenCalledTimes(4);
  });
});
