/**
 * Stackra file contract:
 * Purpose: unit tests of `compareManifests`: additions pass; removals, a moved endpoint, a narrowed input (a newly
 *          required field, a removed enum code, a tighter bound, a dropped null), a widened output (a removed or
 *          newly optional field, a new enum code, a new null) and an event change dropped before its sunset are
 *          breaks.
 * Boundary: test only; `today` is fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 22); ADR 0158; ADR 0131.
 */
import type { Json, StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { compareManifests } from "#core/functions/compare-manifests.function";

/** A manifest with one action whose input and output shapes are given. */
function manifest(
  input: { [key: string]: Json },
  output: { [key: string]: Json },
  extra: Partial<StackraManifest> = {},
): StackraManifest {
  return {
    member: "commerce",
    package: "@acme/service-commerce",
    version: "1.0.0",
    actions: [
      {
        key: "orders.order.cancel@1",
        kind: "action",
        module: "orders",
        class: "CancelOrderAction",
        permission: "orders.order.cancel",
        risk: "L2",
        endpoint: { method: "PUT", path: "/orders/:orderId/cancel", derived: true },
        input: { $ref: "#/schemas/orders.In" },
        output: { $ref: "#/schemas/orders.Out" },
      },
    ],
    permissions: [{ key: "orders.order.cancel", risk: "L2" }],
    errors: [{ code: "order_not_cancellable", kind: "failed_precondition" }],
    schemas: { "orders.In": input, "orders.Out": output },
    ...extra,
  };
}

const IN = {
  type: "object",
  required: ["orderId"],
  properties: {
    orderId: { type: "string" },
    reason: { type: ["string", "null"], maxLength: 200 },
    channel: { type: "string", enum: ["web", "app"] },
  },
};
const OUT = {
  type: "object",
  required: ["status", "at"],
  properties: { status: { type: "string", enum: ["cancelled"] }, at: { type: "string" } },
};

describe("compareManifests", () => {
  const previous = manifest(IN, OUT);

  it("passes additions", () => {
    const next = manifest(
      { ...IN, properties: { ...IN.properties, note: { type: "string" } } },
      { ...OUT, properties: { ...OUT.properties, refund: { type: "integer" } } },
      {
        permissions: [...(previous.permissions ?? []), { key: "orders.order.refund", risk: "L2" }],
      },
    );
    expect(compareManifests(previous, next, "2026-10-24")).toEqual([]);
  });

  it("reports removals and a moved endpoint", () => {
    const next: StackraManifest = {
      ...previous,
      actions: [
        {
          ...(previous.actions?.[0] as NonNullable<StackraManifest["actions"]>[number]),
          endpoint: { method: "POST", path: "/x", derived: false },
        },
      ],
      permissions: [],
      errors: [],
    };
    const messages = compareManifests(previous, next, "2026-10-24").map(
      (entry) => `${entry.section} ${entry.identity} ${entry.message}`,
    );
    expect(messages).toContain("permissions orders.order.cancel removed");
    expect(messages).toContain("errors order_not_cancellable removed");
    expect(messages.some((message) => message.includes("endpoint moved"))).toBe(true);
    expect(compareManifests(previous, { ...previous, actions: [] }, "2026-10-24")).toContainEqual({
      section: "actions",
      identity: "orders.order.cancel@1",
      message: "removed",
    });
  });

  it("reports a narrowed input", () => {
    const next = manifest(
      {
        ...IN,
        required: ["orderId", "channel"],
        properties: {
          orderId: { type: "string" },
          reason: { type: "string", maxLength: 100 },
          channel: { type: "string", enum: ["web"] },
        },
      },
      OUT,
    );
    const messages = compareManifests(previous, next, "2026-10-24").map((entry) => entry.message);
    expect(messages).toContain("input: field `channel` is now required");
    expect(messages).toContain("input.reason: no longer accepts null");
    expect(messages).toContain("input.reason: maxLength tightened to 100");
    expect(messages).toContain("input.channel: no longer accepts app");
  });

  it("reports a widened output", () => {
    const next = manifest(IN, {
      type: "object",
      required: ["status"],
      properties: { status: { type: ["string", "null"], enum: ["cancelled", "refunded"] } },
    });
    const messages = compareManifests(previous, next, "2026-10-24").map((entry) => entry.message);
    expect(messages).toContain("output: field `at` was removed");
    expect(messages).toContain("output.status: may now be null");
    expect(messages).toContain("output.status: may now return refunded");
  });

  it("keeps an event change until its sunset", () => {
    const event = {
      name: "orders.order.paid.v2",
      module: "orders",
      class: "OrderPaid",
      kind: "integration",
    };
    const before = manifest(IN, OUT, {
      events: [{ ...event, changes: [{ from: 1, sunset: "2027-01-01" }] }],
    });
    const after = manifest(IN, OUT, { events: [{ ...event, changes: [] }] });
    expect(compareManifests(before, after, "2026-10-24")).toHaveLength(1);
    expect(compareManifests(before, after, "2027-02-01")).toEqual([]);
  });
});
