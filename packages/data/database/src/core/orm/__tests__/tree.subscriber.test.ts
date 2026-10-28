/**
 * Stackra file contract:
 * Purpose: unit tests of `TreeSubscriber`: a root's path is its id, a child's is its parent's path then its id (the
 *          parent read from the same flush or through the driver in the flush's transaction), a missing parent
 *          refuses the create, an update that changes `parentId` is refused, and a model without `HasTree` is untouched.
 * Boundary: test only; the ORM event arguments, unit of work and driver are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0321 (`HasTree`); ADR 0096 (decision 4); ADR 0022; data-layer gap mo16.
 */
import type { EventArgs } from "@mikro-orm/core";
import { HasPublicId, HasTree, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TreeSubscriber } from "#core/orm/tree.subscriber";

class Category extends Model.with(HasPublicId("cat"), HasTree) {}

class Plain extends Model.with(HasPublicId("pln")) {}

/** The event arguments of a write of `entity`, with `pending` in the flush and `stored` behind the driver. */
function event(
  entity: object,
  options: { pending?: object[]; stored?: object | null; payload?: object } = {},
) {
  const findOne = vi.fn(async (..._args: unknown[]) => options.stored ?? null);
  const args = {
    entity,
    meta: { class: entity.constructor, className: entity.constructor.name, primaryKeys: ["id"] },
    changeSet: options.payload === undefined ? undefined : { payload: options.payload },
    em: {
      getUnitOfWork: () => ({ getPersistStack: () => new Set(options.pending ?? []) }),
      getDriver: () => ({ findOne }),
      getTransactionContext: () => "trx",
    },
  } as unknown as EventArgs<object>;
  return { args, findOne };
}

describe(TreeSubscriber, () => {
  it("writes a root's path as its id", async () => {
    const root = Object.assign(new Category(), { id: "cat_a" });
    await new TreeSubscriber().beforeCreate(event(root).args);
    expect(root.treePath).toBe("cat_a");
  });

  it("writes a child's path under a parent from the same flush or the database", async () => {
    const parent = Object.assign(new Category(), { id: "cat_a", treePath: "cat_a" });
    const child = Object.assign(new Category(), { id: "cat_b", parentId: "cat_a" });
    await new TreeSubscriber().beforeCreate(event(child, { pending: [parent, child] }).args);
    expect(child.treePath).toBe("cat_a.cat_b");

    const grandchild = Object.assign(new Category(), { id: "cat_c", parentId: "cat_b" });
    const { args, findOne } = event(grandchild, { stored: { treePath: "cat_a.cat_b" } });
    await new TreeSubscriber().beforeCreate(args);
    expect(grandchild.treePath).toBe("cat_a.cat_b.cat_c");
    expect(findOne).toHaveBeenCalledWith(Category, { id: "cat_b" }, { ctx: "trx" });
  });

  it("refuses a child whose parent is not found", async () => {
    const orphan = Object.assign(new Category(), { id: "cat_x", parentId: "cat_gone" });
    await expect(new TreeSubscriber().beforeCreate(event(orphan).args)).rejects.toThrow(
      /was not found/,
    );
  });

  it("refuses an update that changes the parent, and leaves other updates and models alone", () => {
    const row = Object.assign(new Category(), { id: "cat_b" });
    expect(() =>
      new TreeSubscriber().beforeUpdate(event(row, { payload: { parentId: "cat_c" } }).args),
    ).toThrow(/CrudService\.move/);
    expect(() =>
      new TreeSubscriber().beforeUpdate(event(row, { payload: { treePath: "x" } }).args),
    ).not.toThrow();
    const plain = new Plain();
    expect(() =>
      new TreeSubscriber().beforeUpdate(event(plain, { payload: { parentId: "x" } }).args),
    ).not.toThrow();
  });
});
