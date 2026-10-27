/**
 * Stackra file contract:
 * Purpose: unit tests of `recordIdKey`: `id`, the model's `<model>Id` and its last word's `<word>Id` are found; an input
 *          with none of them, or no object schema, takes no record.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { recordIdKey } from "#core/functions/record-id-key.function";

describe("recordIdKey", () => {
  it("finds id, <model>Id and <word>Id", () => {
    expect(recordIdKey(z.object({ id: z.string() }), "orders.order")).toBe("id");
    expect(recordIdKey(z.object({ orderId: z.string(), note: z.string() }), "orders.order")).toBe(
      "orderId",
    );
    expect(recordIdKey(z.object({ accountId: z.string() }), "loyalty_kit.loyalty_account")).toBe(
      "accountId",
    );
    expect(
      recordIdKey(z.object({ loyaltyAccountId: z.string() }), "loyalty_kit.loyalty_account"),
    ).toBe("loyaltyAccountId");
  });

  it("finds none in an input without a record", () => {
    expect(recordIdKey(z.object({ note: z.string() }), "orders.order")).toBeUndefined();
    expect(recordIdKey(z.string(), "orders.order")).toBeUndefined();
    expect(recordIdKey(undefined, "orders.order")).toBeUndefined();
  });
});
