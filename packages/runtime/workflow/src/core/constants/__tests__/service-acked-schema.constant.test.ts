/**
 * Stackra file contract:
 * Purpose: unit tests of `SERVICE_ACKED_SCHEMA`: an ack without `kept` still parses; `kept` takes model keys, a
 *          `hold` or `retention` reason and a whole count, and refuses anything else.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0210 (decision 6); STA-1312.
 */
import { describe, expect, it } from "@stackra/testing";

import { SERVICE_ACKED_SCHEMA } from "#core/constants/service-acked-schema.constant";

const ACK = { subject: "era_1", service: "commerce" };

const KEPT = { kind: "orders.order", reason: "retention", count: 12 };

describe("SERVICE_ACKED_SCHEMA", () => {
  it("parses an ack with and without what was kept", () => {
    expect(SERVICE_ACKED_SCHEMA.parse(ACK)).toEqual(ACK);
    expect(SERVICE_ACKED_SCHEMA.parse({ ...ACK, kept: [KEPT] })).toEqual({ ...ACK, kept: [KEPT] });
  });

  it.each([
    { ...KEPT, kind: "Orders" },
    { ...KEPT, kind: "orders" },
    { ...KEPT, reason: "deleted" },
    { ...KEPT, count: -1 },
    { ...KEPT, count: 1.5 },
  ])("refuses a bad kept entry %#", (kept) => {
    expect(SERVICE_ACKED_SCHEMA.safeParse({ ...ACK, kept: [kept] }).success).toBe(false);
  });
});
