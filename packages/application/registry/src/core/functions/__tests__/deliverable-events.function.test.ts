/**
 * Stackra file contract:
 * Purpose: unit tests of `deliverableEvents`: only `webhook: true` events are rows, a personal-data class makes the
 *          payload thin with its named fields, a dropped opt-in is withdrawn, and rows sort by wire name.
 * Boundary: test only; manifests are built with `CatalogueManifest.create`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224; OS-210, OS-212.
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DeliverablePayload } from "#core/enums/deliverable-payload.enum";
import { deliverableEvents } from "#core/functions/deliverable-events.function";
import { CatalogueManifest } from "#core/schemas/catalogue-manifest.schema";

/** A manifest of the `orders` module with `events`. */
const manifest = (events: CatalogueManifest["events"]): CatalogueManifest =>
  CatalogueManifest.create({
    member: "commerce",
    package: "@figentra/service-commerce",
    version: "1",
    modules: [{ key: "orders", dependsOn: [] }],
    actions: [],
    events,
    permissions: [],
  });

const event = (name: string, extra: Partial<CatalogueManifest["events"][number]> = {}) => ({
  name,
  module: "orders",
  class: "OrderEvent",
  kind: "integration",
  ...extra,
});

describe("deliverableEvents", () => {
  it("lists only opted-in events, full or thin by data class", () => {
    const rows = deliverableEvents(
      manifest([
        event("orders.order.shipped.v1", { webhook: true }),
        event("orders.order.placed.v1", {
          webhook: true,
          dataClasses: [DataClassification.Personal],
          thinFields: ["status"],
        }),
        event("orders.order.noted.v1", { webhook: false }),
        event("orders.order.viewed.v1"),
      ]),
    );
    expect(rows).toEqual([
      { type: "orders.order.placed.v1", payload: DeliverablePayload.Thin, thinFields: ["status"] },
      { type: "orders.order.shipped.v1", payload: DeliverablePayload.Full },
    ]);
  });

  it("keeps ids only when a thin event names no fields", () => {
    expect(
      deliverableEvents(
        manifest([event("orders.order.placed.v1", { webhook: true, dataClasses: ["health"] })]),
      ),
    ).toEqual([{ type: "orders.order.placed.v1", payload: "thin", thinFields: [] }]);
  });

  it("withdraws an event the previous release offered", () => {
    const previous = manifest([
      event("orders.order.paid.v1", { webhook: true }),
      event("orders.order.shipped.v1", { webhook: true }),
    ]);
    expect(
      deliverableEvents(manifest([event("orders.order.shipped.v1", { webhook: true })]), previous),
    ).toEqual([
      { type: "orders.order.paid.v1", payload: "full", withdrawn: true },
      { type: "orders.order.shipped.v1", payload: "full" },
    ]);
  });

  it("returns nothing for a manifest with no events", () => {
    expect(deliverableEvents(manifest([]))).toEqual([]);
  });
});
