/**
 * Stackra file contract:
 * Purpose: unit tests of `conversionOf`: an `order.placed`-shaped payload with marketing consent becomes a purchase whose
 *          event id is the order id, with the person hashed, the value, items, click and browser signals and the
 *          consent; no consent, a snapshot without marketing or without an id is `null`; a missing ref is refused.
 * Boundary: test only; digests are computed with `node:crypto`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0355 (decision 1); ADR 0472 (decision 4); analytics gap 12 (stackra-412).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { conversionOf } from "#core/ads/conversion-of.function";
import type { Conversion } from "#core/ads/conversion.type";

/** Hex SHA-256 of `text`. */
const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");

const AT = new Date("2026-10-29T10:00:00.000Z");

const PURCHASE: Conversion = {
  name: "purchase",
  ref: "orderId",
  person: { email: "customer.email", phone: "customer.phone", externalId: "customer.id" },
  value: "total",
  items: "lines",
  clickId: "attribution.clickId",
  ip: "attribution.ip",
  userAgent: "attribution.userAgent",
};

/** An `order.placed` payload, with `overrides`. */
function placed(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    orderId: "ord_1",
    customer: { email: " A@B.example ", phone: "+966500000000", id: "cus_1" },
    total: { amount: "10.00", currency: "SAR" },
    lines: [{ sku: "SKU-1", quantity: 2 }],
    attribution: { clickId: "Cj0K", ip: "203.0.113.9", userAgent: "Mozilla/5.0" },
    consent: { snapshotId: "csn_1", granted: ["necessary", "marketing"] },
    ...overrides,
  };
}

describe(conversionOf, () => {
  it("builds the purchase with the order id as its event id and the consent it was made under", async () => {
    await expect(conversionOf(PURCHASE, placed(), AT, "digits")).resolves.toEqual({
      eventId: "ord_1",
      name: "purchase",
      occurredAt: AT,
      person: {
        email: sha256("a@b.example"),
        phone: sha256("966500000000"),
        externalId: sha256("cus_1"),
      },
      value: { amount: "10.00", currency: "SAR" },
      items: [{ sku: "SKU-1", quantity: 2 }],
      clickId: "Cj0K",
      ip: "203.0.113.9",
      userAgent: "Mozilla/5.0",
      consent: { snapshotId: "csn_1", granted: ["necessary", "marketing"] },
    });
  });

  it("leaves out what the payload does not carry", async () => {
    const event = await conversionOf(
      PURCHASE,
      placed({ customer: { id: "cus_1" }, total: undefined, lines: undefined, attribution: {} }),
      AT,
      "e164",
    );
    expect(event).toEqual({
      eventId: "ord_1",
      name: "purchase",
      occurredAt: AT,
      person: { externalId: sha256("cus_1") },
      consent: { snapshotId: "csn_1", granted: ["necessary", "marketing"] },
    });
  });

  it.each([
    ["no consent", { consent: undefined }],
    ["a snapshot without marketing", { consent: { snapshotId: "csn_1", granted: ["analytics"] } }],
    ["a snapshot with no id", { consent: { snapshotId: "", granted: ["marketing"] } }],
    ["a consent with no granted list", { consent: { snapshotId: "csn_1" } }],
  ])("builds nothing for %s", async (_case, overrides) => {
    await expect(conversionOf(PURCHASE, placed(overrides), AT, "e164")).resolves.toBeNull();
  });

  it("reads the consent from another path", async () => {
    const event = await conversionOf(
      { ...PURCHASE, consent: "meta.consent" },
      placed({
        consent: undefined,
        meta: { consent: { snapshotId: "csn_2", granted: ["marketing"] } },
      }),
      AT,
      "e164",
    );
    expect(event?.consent).toEqual({ snapshotId: "csn_2", granted: ["marketing"] });
  });

  it("refuses a payload with no dedup id", async () => {
    await expect(conversionOf(PURCHASE, placed({ orderId: " " }), AT, "e164")).rejects.toThrow(
      TypeError,
    );
  });
});
