/**
 * Stackra file contract:
 * Purpose: unit tests of `whereOf`: `all`, `any` and `not` become `$and`, `$or` and `$not` (an empty `all` matches
 *          every row, an empty `any` none); every leaf but the presence tests also requires a set column; text, enum,
 *          number, money, date and list operators map to their MikroORM operators, a `like` pattern escapes its
 *          wildcards, a money test keeps its currency and a relative date reads the given time; a leaf the model does
 *          not register is refused.
 * Boundary: test only; the filters are compared as data, the SQL they render is MikroORM's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333 (decisions 2 and 4); ADR 0331 (decisions 3, 6 and 11).
 */
import type { Condition } from "@stackra/rules";
import { Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import { whereOf } from "#node/functions/where-of.function";

const NOW = new Date("2026-10-25T09:00:00Z");

/** A label key, as a fact field takes it. */
const label = (name: string): FactField["label"] =>
  `catalogue::fields.${name}` as FactField["label"];

const PRODUCT_RULES = Rules.create({
  key: "catalogue.product",
  sources: [
    {
      key: "record",
      fields: {
        collection: { type: FieldType.String, label: label("collection") },
        status: {
          type: FieldType.Enum,
          label: label("status"),
          values: { active: label("active"), draft: label("draft") },
        },
        stock: { type: FieldType.Number, label: label("stock") },
        price: { type: FieldType.Money, label: label("price") },
        publishedAt: { type: FieldType.Date, label: label("published_at") },
        tags: { type: FieldType.List, label: label("tags") },
      },
    },
  ],
});

/** The filter of one leaf. */
const leaf = (field: string, operator: Operator, value?: unknown): object =>
  whereOf(
    { field: `record.${field}`, operator, ...(value === undefined ? {} : { value }) } as Condition,
    PRODUCT_RULES,
    NOW,
  );

/** A test on a set `property`. */
const onSet = (property: string, test: object): object => ({
  $and: [{ $not: { [property]: null } }, test],
});

describe(whereOf, () => {
  it("maps the tree, an empty all to every row and an empty any to none", () => {
    const sale: Condition = {
      field: "record.collection",
      operator: Operator.Equals,
      value: "sale",
    };
    const saleFilter = onSet("collection", { collection: { $eq: "sale" } });
    expect(whereOf({ all: [] }, undefined, NOW)).toEqual({});
    expect(whereOf({ any: [] }, undefined, NOW)).toEqual({ $or: [] });
    expect(whereOf({ not: { any: [] } }, undefined, NOW)).toEqual({ $not: { $or: [] } });
    expect(whereOf({ all: [sale, { not: sale }] }, PRODUCT_RULES, NOW)).toEqual({
      $and: [saleFilter, { $not: saleFilter }],
    });
    expect(whereOf({ any: [sale] }, PRODUCT_RULES, NOW)).toEqual({ $or: [saleFilter] });
  });

  it("tests presence without the set guard", () => {
    expect(leaf("collection", Operator.IsNotSet)).toEqual({ collection: null });
    expect(leaf("collection", Operator.IsSet)).toEqual({ $not: { collection: null } });
    expect(leaf("price", Operator.IsNotSet)).toEqual({ price: { minor: null } });
  });

  it("maps text and enum operators, escaping like wildcards", () => {
    expect(leaf("status", Operator.OneOf, ["active"])).toEqual(
      onSet("status", { status: { $in: ["active"] } }),
    );
    expect(leaf("status", Operator.NotEquals, "draft")).toEqual(
      onSet("status", { status: { $ne: "draft" } }),
    );
    expect(leaf("collection", Operator.NotOneOf, ["a"])).toEqual(
      onSet("collection", { collection: { $nin: ["a"] } }),
    );
    expect(leaf("collection", Operator.Contains, "50%_off\\")).toEqual(
      onSet("collection", { collection: { $like: "%50\\%\\_off\\\\%" } }),
    );
    expect(leaf("collection", Operator.StartsWith, "vip")).toEqual(
      onSet("collection", { collection: { $like: "vip%" } }),
    );
    expect(leaf("collection", Operator.EndsWith, "vip")).toEqual(
      onSet("collection", { collection: { $like: "%vip" } }),
    );
  });

  it("maps number and money ranges, a money test keeping its currency", () => {
    expect(leaf("stock", Operator.AtLeast, 5)).toEqual(onSet("stock", { stock: { $gte: 5 } }));
    expect(leaf("stock", Operator.Between, [1, 9])).toEqual(
      onSet("stock", { stock: { $gte: 1, $lte: 9 } }),
    );
    expect(
      leaf("price", Operator.Between, [
        { minor: 100, currency: "USD" },
        { minor: 500, currency: "USD" },
      ]),
    ).toEqual({
      $and: [
        { $not: { price: { minor: null } } },
        { price: { currency: "USD", minor: { $gte: 100, $lte: 500 } } },
      ],
    });
    expect(leaf("price", Operator.LessThan, { minor: 100, currency: "SAR" })).toEqual({
      $and: [
        { $not: { price: { minor: null } } },
        { price: { currency: "SAR", minor: { $lt: 100 } } },
      ],
    });
  });

  it("maps dates, a relative test reading the given time", () => {
    expect(leaf("publishedAt", Operator.WithinLast, "30d")).toEqual(
      onSet("publishedAt", { publishedAt: { $gte: new Date("2026-09-25T09:00:00Z") } }),
    );
    expect(leaf("publishedAt", Operator.NotWithinLast, "PT1H")).toEqual(
      onSet("publishedAt", { publishedAt: { $lt: new Date("2026-10-25T08:00:00Z") } }),
    );
    expect(leaf("publishedAt", Operator.Before, "2026-01-01T00:00:00Z")).toEqual(
      onSet("publishedAt", { publishedAt: { $lt: new Date("2026-01-01T00:00:00Z") } }),
    );
    expect(
      leaf("publishedAt", Operator.Between, ["2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"]),
    ).toEqual(
      onSet("publishedAt", {
        publishedAt: {
          $gte: new Date("2026-01-01T00:00:00Z"),
          $lte: new Date("2026-02-01T00:00:00Z"),
        },
      }),
    );
  });

  it("maps list operators onto the jsonb array", () => {
    expect(leaf("tags", Operator.Includes, "vip")).toEqual(
      onSet("tags", { tags: { $hasKey: "vip" } }),
    );
    expect(leaf("tags", Operator.IncludesAny, ["a", "b"])).toEqual(
      onSet("tags", { tags: { $hasSomeKeys: ["a", "b"] } }),
    );
    expect(leaf("tags", Operator.IncludesAll, ["a", "b"])).toEqual(
      onSet("tags", { tags: { $hasKeys: ["a", "b"] } }),
    );
    expect(leaf("tags", Operator.IncludesNone, ["a"])).toEqual(
      onSet("tags", { $not: { tags: { $hasSomeKeys: ["a"] } } }),
    );
    expect(leaf("tags", Operator.IsEmpty)).toEqual(onSet("tags", { tags: { $eq: [] } }));
    expect(leaf("tags", Operator.IsNotEmpty)).toEqual(
      onSet("tags", { $not: { tags: { $eq: [] } } }),
    );
  });

  it("refuses a leaf the model does not register", () => {
    const unknown: Condition = { field: "record.secret", operator: Operator.IsSet };
    expect(() => whereOf(unknown, PRODUCT_RULES, NOW)).toThrow(TypeError);
    expect(() => whereOf({ all: [unknown] }, undefined, NOW)).toThrow(TypeError);
  });
});
