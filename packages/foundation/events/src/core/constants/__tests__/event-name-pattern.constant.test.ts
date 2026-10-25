/**
 * Stackra file contract:
 * Purpose: unit tests of `EVENT_NAME_PATTERN`: the template's names pass; a single segment, capitals, a leading digit,
 *          an empty segment and an already-qualified wire name with a version suffix are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0141 (2026-10-23 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { EVENT_NAME_PATTERN } from "#core/constants/event-name-pattern.constant";

describe("EVENT_NAME_PATTERN", () => {
  it.each([
    "order.paid",
    "inbox_message.created",
    "scan.barcode_scanned",
    "stock.low",
    "lead.submitted",
  ])("accepts %s", (name) => {
    expect(EVENT_NAME_PATTERN.test(name)).toBe(true);
  });

  it.each(["paid", "Order.paid", "1order.paid", "order..paid", "order.paid.", "order-paid.x"])(
    "refuses %s",
    (name) => {
      expect(EVENT_NAME_PATTERN.test(name)).toBe(false);
    },
  );
});
