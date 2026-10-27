/**
 * Stackra file contract:
 * Purpose: unit tests of `memberGraphOf`: a service's modules, the services it calls (injected client and imported
 *          client, itself left out), the integration events it publishes and those its listeners consume (wire names
 *          from the producer's manifest; an unpublished one and an own one left out), its tables, the packages it
 *          builds on and its ports with their driver candidates, all sorted.
 * Boundary: test only; the IR and the manifests are built by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0452 (decision 1).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { memberGraphOf } from "#core/functions/member-graph-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A class of the shipping member. */
function declared(extra: Partial<DeclaredClass>): DeclaredClass {
  return {
    name: "X",
    kind: "service",
    module: "shipments",
    file: "src/modules/shipments/x.ts",
    importPath: "#modules/shipments/x",
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...extra,
  };
}

/** Commerce's committed manifest: one integration event and one domain event. */
const COMMERCE = {
  member: "commerce",
  package: "@acme/commerce",
  version: "0.1.0",
  events: [
    { name: "orders.order.paid.v1", module: "orders", class: "OrderPaid", kind: "integration" },
    { name: "orders.order.placed", module: "orders", class: "OrderPlaced", kind: "domain" },
  ],
} as unknown as StackraManifest;

const IR: MemberIR = {
  member: "shipping",
  package: "@acme/shipping",
  version: "0.1.0",
  layout: "service",
  modules: ["shipments", "labels"],
  classes: [
    declared({
      name: "ShipmentService",
      deps: [{ class: { name: "CommerceClient", from: "#stackra/clients/commerce" } }],
    }),
    declared({
      name: "ShipOnPaidListener",
      kind: "listener",
      handle: { event: { name: "OrderPaid", from: "#stackra/clients/commerce" } },
    }),
    declared({
      name: "ShipOnPlacedListener",
      kind: "listener",
      handle: { event: { name: "OrderPlaced", from: "#stackra/clients/commerce" } },
    }),
    declared({
      name: "OwnListener",
      kind: "listener",
      handle: { event: { name: "ShipmentSent", from: "#modules/shipments/events" } },
    }),
  ],
  shapes: [],
  enums: [],
  files: [],
  packages: [
    "@acme/carriers-kit",
    "@stackra/outbox",
    "vitest",
    "@stackra/actions",
    "@acme/shipping",
  ],
  dependencies: [
    {
      package: "@acme/carriers-kit",
      manifest: { member: "carriers_kit", package: "@acme/carriers-kit", version: "1.0.0" },
    },
  ],
  services: [{ member: "commerce", manifest: COMMERCE }],
  clientImports: [
    { service: "catalogue", file: "src/modules/labels/label.ts" },
    { service: "shipping", file: "src/modules/labels/self.ts" },
  ],
  errors: [],
};

const MANIFEST = {
  member: "shipping",
  package: "@acme/shipping",
  version: "0.1.0",
  events: [
    {
      name: "shipments.shipment.sent.v1",
      module: "shipments",
      class: "ShipmentSent",
      kind: "integration",
    },
    {
      name: "shipments.shipment.drafted",
      module: "shipments",
      class: "ShipmentDrafted",
      kind: "domain",
    },
  ],
  models: [
    { key: "shipments.shipment", table: "shipments", publicId: "shp", traits: [] },
    { key: "labels.label", table: "labels", publicId: "lbl", traits: [] },
  ],
  drivers: [
    { port: "Carrier", key: "carriers_kit.Carrier", candidates: ["dhl", "aramex"] },
    { port: "LabelPrinter", key: "shipping.LabelPrinter", candidates: [] },
  ],
} as unknown as StackraManifest;

describe("memberGraphOf", () => {
  it("lists what the member is, calls, publishes, consumes, stores, builds on and binds", () => {
    expect(memberGraphOf(IR, MANIFEST)).toEqual({
      member: "shipping",
      package: "@acme/shipping",
      layout: "service",
      modules: ["labels", "shipments"],
      calls: ["catalogue", "commerce"],
      eventsOut: ["shipments.shipment.sent.v1"],
      eventsIn: ["orders.order.paid.v1"],
      tables: ["labels", "shipments"],
      packages: ["@acme/carriers-kit", "@stackra/actions", "@stackra/outbox"],
      drivers: [
        { port: "carriers_kit.Carrier", candidates: ["aramex", "dhl"] },
        { port: "shipping.LabelPrinter", candidates: [] },
      ],
    });
  });

  it("is empty for a package with nothing to show", () => {
    const graph = memberGraphOf(
      {
        ...IR,
        layout: "package",
        modules: [],
        classes: [],
        packages: [],
        dependencies: [],
        services: [],
        clientImports: [],
      },
      { member: "shipping", package: "@acme/shipping", version: "0.1.0" },
    );
    expect(graph).toMatchObject({
      calls: [],
      eventsOut: [],
      eventsIn: [],
      tables: [],
      packages: [],
      drivers: [],
    });
  });
});
