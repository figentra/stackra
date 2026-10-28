/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `ViewStore` port: it is its own token, a driver implements list, save and remove,
 *          and the port key narrows its driver names.
 * Boundary: test only; an in-memory subclass stands in for a driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ViewStore } from "#core/ports/view-store.port";
import type { SavedView } from "#core/schemas/saved-view.schema";

/** A store over one array. */
class ArrayViewStore extends ViewStore {
  readonly views: SavedView[] = [];

  async list(resource: string): Promise<readonly SavedView[]> {
    return this.views.filter((view) => view.resource === resource);
  }

  async save(view: SavedView): Promise<SavedView> {
    this.views.push(view);
    return view;
  }

  async remove(id: string): Promise<void> {
    const index = this.views.findIndex((view) => view.id === id);
    if (index >= 0) this.views.splice(index, 1);
  }
}

describe("ViewStore", () => {
  it("is a port a driver extends", async () => {
    const store = new ArrayViewStore();
    expect(store).toBeInstanceOf(Port);
    await store.save({ id: "view_1", resource: "orders.order" } as SavedView);
    expect(await store.list("orders.order")).toHaveLength(1);
    await store.remove("view_1");
    await store.remove("view_1");
    expect(await store.list("orders.order")).toEqual([]);
  });

  it("carries its port key", () => {
    expectTypeOf<ViewStore["~key"]>().toEqualTypeOf<"panel.ViewStore">();
  });
});
