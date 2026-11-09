/**
 * Stackra file contract:
 * Purpose: `COURIER_PACKAGE_IR`, a carrier package as a product ships one (`@acme/ship-courier`): an Integration that
 *          receives Standard Webhooks, its Connection and one `WebhookEvent<CourierIntegration>`, all in `src/node/`,
 *          so its manifest lists the event for the service that hosts it.
 * Boundary: test data only; never imported by package code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 15 and 16); ADR 0294 (decision 15: entry folders).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** Where the Integration lives inside the package. */
const INTEGRATION = "#node/integrations/courier.integration";

/** A kind class of the package with every list empty unless given. */
function declared(
  name: string,
  kind: string,
  file: string,
  more: Partial<DeclaredClass> = {},
): DeclaredClass {
  return {
    name,
    kind,
    module: "ship_courier",
    file,
    importPath: `#${file.replace(/^src\//, "").replace(/\.ts$/, "")}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...more,
  };
}

/** The courier carrier package, read. */
export const COURIER_PACKAGE_IR: MemberIR = {
  member: "ship_courier",
  package: "@acme/ship-courier",
  version: "0.1.0",
  layout: "package",
  modules: ["ship_courier"],
  classes: [
    declared("CourierIntegration", "integration", "src/node/integrations/courier.integration.ts", {
      options: {
        webhooks: {
          scheme: "standard_webhooks",
          secret: "{webhookSecret}",
          eventType: { path: "type" },
        },
      },
    }),
    declared("CourierConnection", "connection", "src/node/connections/courier.connection.ts", {
      partner: { name: "CourierIntegration", kind: "integration", from: INTEGRATION },
    }),
    declared(
      "CourierShipmentUpdated",
      "webhook_event",
      "src/node/events/courier-shipment-updated.event.ts",
      {
        options: { type: "shipment.updated" },
        partner: { name: "CourierIntegration", kind: "integration", from: INTEGRATION },
      },
    ),
  ],
  shapes: [],
  enums: [],
  files: [],
  dependencies: [],
  errors: [],
};
