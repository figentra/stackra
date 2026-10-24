/**
 * Stackra file contract:
 * Purpose: unit tests of `GraphQuery`: it reads the source rows with the limit, loads each row's relation (a link
 *          through its resolver), returns them under the field keys, and refuses a bad limit, bad keys or a field the
 *          related row lacks.
 * Boundary: test only; a fake database returns the source rows and a fake resolver serves the link.
 * Runtime: node (vitest)
 * Governing contract: ADR 0104 (decision 2); ADR 0268 (R10); ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { HasPublicId, Link, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";
import { GraphQuery } from "#core/services/graph-query.service";

class Variant extends Model.with(HasPublicId("var")) {
  sku = "TEE-M";
}

class OrderLine extends Model.with(HasPublicId("oln")) {
  variant!: Link<Variant>;

  quantity = 2;
}

/** A database whose `find` returns one line linked to `var_1`. */
class LinesDatabase extends Database {
  readonly find = vi.fn(async () => [
    Object.assign(new OrderLine(), { variant: new Link<Variant>("catalogue.variant", "var_1") }),
  ]);

  em(): EntityManager {
    return { find: this.find } as unknown as EntityManager;
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
  Link.useResolver(undefined);
});

describe(GraphQuery, () => {
  it("follows the link of each source row", async () => {
    const database = new LinesDatabase();
    ACTIVE_DATABASE.current = database;
    Link.useResolver(async (_model, id) => Object.assign(new Variant(), { id, sku: "TEE-M" }));
    const rows = await new GraphQuery().through(OrderLine, "variant", {
      where: { quantity: { $gt: 0 } },
      fields: { line: ["variant", "quantity"], variant: ["sku"] },
      limit: 100,
    });
    expect(database.find).toHaveBeenCalledWith(OrderLine, { quantity: { $gt: 0 } }, { limit: 100 });
    expect(rows[0]?.line.quantity).toBe(2);
    expect(rows[0]?.variant.sku).toBe("TEE-M");
  });

  it("refuses a bad limit, bad field keys and a field the related row lacks", async () => {
    ACTIVE_DATABASE.current = new LinesDatabase();
    Link.useResolver(async (_model, id) => Object.assign(new Variant(), { id }));
    const graph = new GraphQuery();
    await expect(
      graph.through(OrderLine, "variant", { fields: { line: [], variant: [] }, limit: 101 }),
    ).rejects.toThrow(RangeError);
    await expect(graph.through(OrderLine, "variant", { fields: { line: [] } })).rejects.toThrow(
      /names the source/,
    );
    await expect(
      graph.through(OrderLine, "variant", { fields: { line: [], variant: ["barcode"] } }),
    ).rejects.toThrow(/variant has no field barcode/);
  });
});
