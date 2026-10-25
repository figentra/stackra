/**
 * Stackra file contract:
 * Purpose: unit tests of `registerDimensions` and `conditionFields`: rows are stored per model (a later row for a field
 *          replaces it), malformed rows are refused, and every tested field of a condition tree is found.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0351 (decisions 1 to 3).
 */
import { Operator } from "@stackra/rules/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { DIMENSION_REGISTRY } from "#core/constants/dimension-registry.constant";
import { conditionFields } from "#core/functions/condition-fields.function";
import { registerDimensions } from "#core/functions/register-dimensions.function";

describe("registerDimensions", () => {
  beforeEach(() => {
    DIMENSION_REGISTRY.clear();
  });

  it("stores rows per model, a later row replacing its field", () => {
    registerDimensions([
      { model: "orders.order", field: "record.channel_id", dimension: "sales.channel" },
      { model: "orders.order", field: "record.location_id", dimension: "inventory.location" },
      { model: "orders.order", field: "record.channel_id", dimension: "sales.storefront" },
    ]);
    expect(DIMENSION_REGISTRY.get("orders.order")?.map((row) => row.dimension)).toEqual([
      "inventory.location",
      "sales.storefront",
    ]);
  });

  it.each([
    [{ model: "Orders", field: "record.channel_id", dimension: "sales.channel" }],
    [{ model: "orders.order", field: "channel_id", dimension: "sales.channel" }],
    [{ model: "orders.order", field: "record.channel_id", dimension: "channel" }],
  ])("refuses %j", (row) => {
    expect(() => registerDimensions([row])).toThrow(TypeError);
  });
});

describe("conditionFields", () => {
  it("finds every tested field", () => {
    const fields = conditionFields({
      all: [
        { field: "record.channel_id", operator: Operator.Equals, value: "chn_1" },
        { not: { any: [{ field: "record.region", operator: Operator.IsSet }] } },
      ],
    });
    expect([...fields].sort()).toEqual(["record.channel_id", "record.region"]);
  });
});
