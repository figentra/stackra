/**
 * Stackra file contract:
 * Purpose: unit tests of `webhookEventsOf`: a package lists each `WebhookEvent<I>` with its type, module and public
 *          entry, its Integration's locked key, class and entry, and that Integration's Connection; an event typed
 *          against an Integration the package does not declare keeps only the Integration it names; a service, and a
 *          package with no webhook event, write no row.
 * Boundary: test only; runs on the courier and loyalty kit package fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 15 and 16); ADR 0294 (decision 15: entry folders).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { webhookEventsOf } from "#core/functions/webhook-events-of.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COURIER_PACKAGE_IR } from "#core/__tests__/fixtures/courier-package-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

/** The `integrations` rows `webhookEventsOf` reads. */
type Integrations = Parameters<typeof webhookEventsOf>[1];

/** The rows `ir` writes against the integrations its own manifest locks. */
function rowsOf(ir: MemberIR) {
  const { manifest } = buildManifest(ir);
  return webhookEventsOf(ir, (manifest["integrations"] ?? []) as Integrations);
}

/** The package's `webhookEvents` section. */
describe("webhookEventsOf", () => {
  /** A host imports every class from the entry the row names, so each is a public entry, never `src/`. */
  it("lists a package's event with its Integration and Connection, each by its public entry", () => {
    expect(rowsOf(COURIER_PACKAGE_IR)).toEqual([
      {
        class: "CourierShipmentUpdated",
        type: "shipment.updated",
        module: "ship_courier",
        from: "@acme/ship-courier/node",
        integration: {
          key: "ship_courier.courier",
          class: "CourierIntegration",
          from: "@acme/ship-courier/node",
        },
        connection: { class: "CourierConnection", from: "@acme/ship-courier/node" },
      },
    ]);
  });

  /** An event typed against another package's Integration is written as named, so its host can refuse it. */
  it("keeps only the named Integration of an event typed against one the package does not declare", () => {
    const ir: MemberIR = {
      ...COURIER_PACKAGE_IR,
      classes: COURIER_PACKAGE_IR.classes.map((declared) =>
        declared.kind === "webhook_event"
          ? {
              ...declared,
              partner: {
                name: "DepotIntegration",
                kind: "integration",
                from: "@acme/ship-depot/node",
              },
            }
          : declared,
      ),
    };
    expect(rowsOf(ir)).toEqual([
      expect.objectContaining({
        integration: { class: "DepotIntegration", from: "@acme/ship-depot/node" },
      }),
    ]);
    expect(rowsOf(ir)[0]).not.toHaveProperty("connection");
  });

  /** Only a package is hosted, and a package with no webhook event has nothing to list. */
  it("writes no row for a service or for a package with no webhook event", () => {
    expect(rowsOf(BILLING_IR)).toEqual([]);
    expect(rowsOf(LOYALTY_KIT_IR)).toEqual([]);
  });
});
