/**
 * Stackra file contract:
 * Purpose: unit tests of `FACT_SOURCE_SCHEMA` (`FactSource$`): a source another service publishes parses, builds a
 *          `Rules` registry and checks a condition's fields at write time; a bad key, type or label and an empty
 *          source are refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decisions 4 and 11); ADR 0425 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { FACT_SOURCE_SCHEMA } from "#core/constants/fact-source-schema.constant";
import { Rules } from "#core/values/rules.value";

const PUBLISHED = {
  key: "order",
  fields: {
    total: { type: "number", label: "orders::facts.total" },
    status: {
      type: "enum",
      label: "orders::facts.status",
      values: { paid: "orders::status.paid" },
    },
  },
};

describe("FactSource$", () => {
  it("parses a published source into a registry that checks conditions at write time", () => {
    const rules = Rules.create({
      key: "access.policy",
      sources: [FACT_SOURCE_SCHEMA.parse(PUBLISHED)],
    });
    const schema = rules.conditionSchema();
    expect(schema.safeParse({ field: "order.total", operator: "at_least", value: 3 }).success).toBe(
      true,
    );
    expect(
      schema
        .safeParse({ all: [{ field: "order.secret", operator: "is_set" }] })
        .error?.issues.map((issue) => [issue.path.join("."), issue.message]),
    ).toEqual([["all.0", "field_unknown"]]);
  });

  it.each([
    { ...PUBLISHED, key: "Order" },
    { ...PUBLISHED, fields: {} },
    { ...PUBLISHED, fields: { total: { type: "decimal", label: "orders::facts.total" } } },
    { ...PUBLISHED, fields: { total: { type: "number", label: "Total" } } },
  ])("refuses %j", (source) => {
    expect(FACT_SOURCE_SCHEMA.safeParse(source).success).toBe(false);
  });
});
