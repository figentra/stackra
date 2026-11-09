/**
 * Stackra file contract:
 * Purpose: unit tests of `hostedWebhookEvents`: a service pairs each event its hosted package's manifest lists with
 *          the Integration and Connection that manifest lists; a manifest written before `webhookEvents` brings none;
 *          `webhook_event_unpaired` refuses an event whose Integration the manifest does not list, or whose Connection
 *          differs from the Integration's, naming both; `webhook_route_duplicate` refuses two hosted classes for one
 *          event type, and the service's own copy of a hosted event; only a service hosts.
 * Boundary: test only; runs on the billing service and on the manifest `buildManifest` derives for the courier package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 15 and 16); ADR 0294 (decision 22).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { hostedWebhookEvents } from "#core/functions/hosted-webhook-events.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COURIER_PACKAGE_IR } from "#core/__tests__/fixtures/courier-package-ir.fixture";

/** The courier package's manifest, as gen writes it. */
const COURIER = buildManifest(COURIER_PACKAGE_IR).manifest;

/** The courier package's one listed event row. */
const ROW = (COURIER["webhookEvents"] as readonly Readonly<Record<string, unknown>>[])[0] ?? {};

/** The billing service hosting the courier package with `manifest` as its committed manifest. */
function hosting(manifest: StackraManifest, classes: readonly DeclaredClass[] = []): MemberIR {
  return {
    ...BILLING_IR,
    classes: [...BILLING_IR.classes, ...classes],
    dependencies: [...BILLING_IR.dependencies, { package: "@acme/ship-courier", manifest }],
  };
}

/** The courier manifest with `rows` as its `webhookEvents`. */
function listing(...rows: readonly Readonly<Record<string, unknown>>[]): StackraManifest {
  return { ...COURIER, webhookEvents: rows };
}

/** `row` without `field`. */
function without(row: Readonly<Record<string, unknown>>, field: string) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== field));
}

/** The codes and messages of the refusals for `ir`. */
function refusalsOf(ir: MemberIR) {
  return hostedWebhookEvents(ir).errors.map(({ code, message }) => ({ code, message }));
}

/** Pairing a hosted package's webhook events from its manifest. */
describe("hostedWebhookEvents", () => {
  /** The event, its Integration and its Connection all come from the package's own manifest and entry. */
  it("pairs a listed event with the Integration and Connection its manifest lists", () => {
    const { events, errors } = hostedWebhookEvents(hosting(COURIER));
    expect(errors).toEqual([]);
    expect(events).toEqual([
      {
        package: "@acme/ship-courier",
        event: { name: "CourierShipmentUpdated", from: "@acme/ship-courier/node" },
        type: "shipment.updated",
        integration: { name: "CourierIntegration", from: "@acme/ship-courier/node" },
        connection: { name: "CourierConnection", from: "@acme/ship-courier/node" },
      },
    ]);
  });

  /** A manifest committed before the section has no `webhookEvents`: it lists none and refuses nothing. */
  it("brings nothing from a manifest written before `webhookEvents`", () => {
    const older = without(COURIER, "webhookEvents") as StackraManifest;
    expect(hostedWebhookEvents(hosting(older))).toEqual({
      events: [],
      errors: [],
    });
  });

  /** An Integration the same manifest does not list would register the event half paired. */
  it("refuses an event whose Integration its manifest does not list, naming both", () => {
    const ir = hosting(
      listing({
        ...ROW,
        integration: { class: "DepotIntegration", from: "@acme/ship-depot/node" },
      }),
    );
    expect(hostedWebhookEvents(ir).events).toEqual([]);
    expect(refusalsOf(ir)).toEqual([
      {
        code: "webhook_event_unpaired",
        message: expect.stringMatching(/CourierShipmentUpdated .*DepotIntegration/),
      },
    ]);
  });

  /** A Connection other than the Integration's (or none where it has one) would 404 its connection URL. */
  it("refuses an event whose Connection is not its Integration's, naming both", () => {
    const unconnected = without(ROW, "connection");
    const ir = hosting(
      listing(
        { ...ROW, connection: { class: "ParcelConnection", from: "@acme/ship-courier/node" } },
        { ...unconnected, class: "CourierShipmentLost", type: "shipment.lost" },
      ),
    );
    expect(hostedWebhookEvents(ir).events).toEqual([]);
    expect(refusalsOf(ir)).toEqual([
      {
        code: "webhook_event_unpaired",
        message: expect.stringMatching(/with ParcelConnection, .* by CourierConnection$/),
      },
      {
        code: "webhook_event_unpaired",
        message: expect.stringMatching(/with no Connection, .* by CourierConnection$/),
      },
    ]);
  });

  /** Two hosted classes for one event type of one Integration would route it twice. */
  it("refuses two hosted classes for one event type of one Integration", () => {
    const ir = hosting(listing(ROW, { ...ROW, class: "CourierShipmentChanged" }));
    expect(hostedWebhookEvents(ir).events).toHaveLength(1);
    expect(refusalsOf(ir)).toEqual([
      {
        code: "webhook_route_duplicate",
        message: expect.stringMatching(
          /^CourierShipmentChanged and CourierShipmentUpdated of .* "shipment\.updated" webhook$/,
        ),
      },
    ]);
  });

  /** The service's own copy of an event its package now ships is a second route for the same type. */
  it("refuses the service's own event for a type its hosted package already handles", () => {
    const own: DeclaredClass = {
      name: "ShipmentUpdated",
      kind: "webhook_event",
      module: "billing",
      file: "src/modules/billing/events/shipment-updated.event.ts",
      importPath: "#modules/billing/events/shipment-updated.event",
      options: { type: "shipment.updated" },
      partner: { name: "CourierIntegration", kind: "integration", from: "@acme/ship-courier/node" },
      deps: [],
      facets: [],
      methods: [],
      refusals: [],
      statics: {},
      traits: [],
    };
    const { errors } = hostedWebhookEvents(hosting(COURIER, [own]));
    expect(errors).toEqual([
      expect.objectContaining({
        code: "webhook_route_duplicate",
        file: own.file,
        subject: "ShipmentUpdated",
      }),
    ]);
    expect(buildManifest(hosting(COURIER, [own])).errors.map(({ code }) => code)).toContain(
      "webhook_route_duplicate",
    );
  });

  /** A package is never a host, so its dependencies' events are not its to register. */
  it("hosts nothing for a package", () => {
    expect(
      hostedWebhookEvents({
        ...COURIER_PACKAGE_IR,
        dependencies: [{ package: "@acme/ship-courier", manifest: COURIER }],
      }),
    ).toEqual({ events: [], errors: [] });
  });
});
