/**
 * Stackra file contract:
 * Purpose: unit tests of `CALL_KEY_PATTERN`: the template's written keys pass; a module prefix, a version, camelCase,
 *          kebab-case and a single segment fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { CALL_KEY_PATTERN } from "#core/constants/call-key-pattern.constant";

describe("CALL_KEY_PATTERN", () => {
  it("accepts <model>.<verb> in snake_case", () => {
    for (const key of [
      "order.create",
      "order.expire_unpaid",
      "inbox_message.mark_read",
      "points.stats_today",
    ])
      expect(CALL_KEY_PATTERN.test(key)).toBe(true);
  });

  it("refuses prefixes, versions and other casings", () => {
    for (const key of [
      "orders.order.create",
      "order.create@1",
      "order.markRead",
      "order.mark-read",
      "order",
      "Order.create",
    ])
      expect(CALL_KEY_PATTERN.test(key)).toBe(false);
  });
});
