/**
 * Stackra file contract:
 * Purpose: unit tests of `PageContext` and its shipped schema: a context with a record, a selection and a modal
 *          parses; a selection of more than 200 ids, a record that is not a public id and a missing route fail.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decision 5); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { PAGE_CONTEXT_SCHEMA } from "#core/constants/page-context-schema.constant";
import { PageContext } from "#core/schemas/page-context.schema";

const ORDER = "ord_01h2j3k4l5m6n7p8q9r0s1t2v3";

describe("PageContext", () => {
  it("registers the shipped schema and parses a full context", () => {
    expect(schemaOf(PageContext)).toBe(PAGE_CONTEXT_SCHEMA);
    expect(
      validate(PageContext, {
        app: "console",
        route: "order_detail",
        params: { orderId: ORDER },
        record: ORDER,
        selection: { ids: [ORDER], count: 1 },
        filters: { status: "open", tags: ["a", "b"] },
        view: "mine",
        modal: { action: "orders.order.cancel", fields: ["reason"] },
      }).success,
    ).toBe(true);
    expect(validate(PageContext, { app: "console", route: "home", params: {} }).success).toBe(true);
  });

  it("refuses more than 200 selection ids", () => {
    const ids = Array.from({ length: 201 }, () => ORDER);
    expect(
      validate(PageContext, {
        app: "console",
        route: "home",
        params: {},
        selection: { ids, count: 201 },
      }).success,
    ).toBe(false);
  });

  it("refuses a record that is not a public id and a context with no route", () => {
    expect(
      validate(PageContext, { app: "console", route: "home", params: {}, record: "42" }).success,
    ).toBe(false);
    expect(validate(PageContext, { app: "console", params: {} }).success).toBe(false);
  });
});
