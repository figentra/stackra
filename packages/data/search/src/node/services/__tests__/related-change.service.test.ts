/**
 * Stackra file contract:
 * Purpose: unit tests of `RelatedChangeService`: a change of a related row finds its parents through the relation path
 *          and re-indexes them in one call; a two-hop path nests the filter; an update of a field the parent does not
 *          read is skipped; a model with no relation entry is ignored.
 * Boundary: test only; the search reader and the database are stand-ins recording calls, and `SEARCH_RELATIONS` is
 *           set directly and cleared after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decision 5); data-layer gap se4.
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Model } from "@stackra/model";
import { RowChangeKind } from "@stackra/outbox/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { Search } from "#core/index";
import { SEARCH_RELATIONS } from "#node/constants/search-relations.constant";
import { RelatedChangeService } from "#node/services/related-change.service";

class Product extends Model.with() {}
class Variant extends Model.with() {}
class Option extends Model.with() {}

const PARENT = { id: "prd_1" };

/** A service over stand-ins; `found` is what the database finds. */
function setup(found: readonly object[]) {
  const index = { index: vi.fn(async () => undefined) };
  const search = { in: vi.fn(() => index) } as unknown as Search;
  const find = vi.fn(async () => found);
  const database = { em: () => ({ find }) } as unknown as Database;
  return { index, search, find, service: new RelatedChangeService(search, database) };
}

afterEach(() => {
  SEARCH_RELATIONS.clear();
});

describe(RelatedChangeService, () => {
  it("is a service", () => {
    expect(setup([]).service).toBeInstanceOf(Service);
  });

  it("re-indexes the parents of a run of changed rows in one call", async () => {
    SEARCH_RELATIONS.set("Variant", [
      { parent: Product, child: Variant, via: ["variants"], reads: new Set(["sku", "product"]) },
    ]);
    const { index, search, find, service } = setup([PARENT]);
    await service.consumeMany([
      { model: "Variant", id: "var_1", kind: RowChangeKind.Updated, fields: ["sku"] },
      { model: "Variant", id: "var_2", kind: RowChangeKind.Created, fields: ["sku", "product"] },
      { model: "Variant", id: "var_3", kind: RowChangeKind.Updated, fields: ["product"] },
    ]);
    expect(find).toHaveBeenCalledExactlyOnceWith(Product, {
      variants: { $in: ["var_1", "var_2", "var_3"] },
    });
    expect(search.in).toHaveBeenCalledWith(Product);
    expect(index.index).toHaveBeenCalledExactlyOnceWith([PARENT]);
  });

  it("nests the filter of a two-hop path", async () => {
    SEARCH_RELATIONS.set("Option", [
      { parent: Product, child: Option, via: ["variants", "options"], reads: new Set(["label"]) },
    ]);
    const { find, service } = setup([PARENT]);
    await service.consume({
      model: "Option",
      id: "opt_1",
      kind: RowChangeKind.Updated,
      fields: ["label"],
    });
    expect(find).toHaveBeenCalledWith(Product, { variants: { options: { $in: ["opt_1"] } } });
  });

  it("skips an update the parent does not read, and a model with no relation", async () => {
    SEARCH_RELATIONS.set("Variant", [
      { parent: Product, child: Variant, via: ["variants"], reads: new Set(["sku"]) },
    ]);
    const { find, index, service } = setup([PARENT]);
    await service.consume({
      model: "Variant",
      id: "var_1",
      kind: RowChangeKind.Updated,
      fields: ["stock"],
    });
    await service.consume({ model: "Order", id: "ord_1", kind: RowChangeKind.Created, fields: [] });
    expect(find).not.toHaveBeenCalled();
    expect(index.index).not.toHaveBeenCalled();
  });
});
