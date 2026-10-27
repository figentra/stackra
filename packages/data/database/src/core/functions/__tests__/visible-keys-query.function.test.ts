/**
 * Stackra file contract:
 * Purpose: unit tests of `visibleKeysQuery`: with no visibility driver it is `undefined`; with conditions it builds the
 *          subquery of the primary key under the same filter the reads use.
 * Boundary: test only; a fake `Database` hands out a recording entity manager and query builder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0333 (decision 4 and its amendment); ADR 0022; ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";
import { visibleKeysQuery } from "#core/functions/visible-keys-query.function";
import type { Database } from "#core/ports/database.port";
import { VisibilityFilter } from "#contracts/ports/visibility-filter.port";

class Matter {}

/** A database whose query builder records its calls. */
function connect() {
  const builder = {
    select: vi.fn(() => builder),
    where: vi.fn(() => builder),
    toQuery: vi.fn(() => ({
      sql: 'select "visible"."id" from "matters" as "visible" where "wall" = ?',
      params: [1],
    })),
  };
  const em = {
    getMetadata: () => ({ primaryKeys: ["id"] }),
    createQueryBuilder: vi.fn(() => builder),
  };
  ACTIVE_DATABASE.current = { em: () => em } as unknown as Database;
  return { em, builder };
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
  connectVisibilityFilter(undefined);
});

describe(visibleKeysQuery, () => {
  it("is undefined with no visibility driver", async () => {
    connect();
    expect(await visibleKeysQuery(Matter)).toBeUndefined();
  });

  it("builds the key subquery under the visibility conditions", async () => {
    const { em, builder } = connect();
    const filter = { conditionsFor: async () => ({ wall: 1 }) } as unknown as VisibilityFilter;
    connectVisibilityFilter({
      has: (token) => token === VisibilityFilter,
      get: () => filter as never,
    });
    expect(await visibleKeysQuery(Matter)).toEqual({
      sql: 'select "visible"."id" from "matters" as "visible" where "wall" = ?',
      params: [1],
    });
    expect(em.createQueryBuilder).toHaveBeenCalledWith(Matter, "visible");
    expect(builder.select).toHaveBeenCalledWith("id");
    expect(builder.where).toHaveBeenCalledWith({ $and: [{}, { wall: 1 }] });
  });
});
