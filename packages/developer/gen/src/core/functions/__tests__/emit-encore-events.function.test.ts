/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreEvents`: a publishing service gets one Pub/Sub topic per integration event,
 *          registered under its wire name; a relay service also gets one subscription per integration topic of the
 *          product (its own and each publisher's, a shared wire name once) into its inbox; a typed consumer gets one
 *          subscription per consumed event on the producer's topic (none for an event its relay hears or the producer
 *          does not publish); a local listener of the service's own integration event gets one on its own topic
 *          (STA-1302); nothing for a package, an app, or a service that neither publishes, relays nor consumes.
 * Boundary: test only; runs on the IR fixtures and the manifests built from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decision 4); ADR 0141; ADR 0148 (decisions 3 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreEvents } from "#core/functions/emit-encore-events.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** A relay or consumer file climbs to the services folder; a variable keeps the import-shaped strings out of the ADR 0233 import check. */
const UP = "../../../../";

/** The relay listener of the webhooks service. */
const RELAY: DeclaredClass = {
  name: "FanOutOnEventListener",
  kind: "listener",
  module: "deliveries",
  file: "src/modules/deliveries/listeners/fan-out-on-event.listener.ts",
  importPath: "#modules/deliveries/listeners/fan-out-on-event.listener",
  options: {},
  deps: [],
  facets: [],
  methods: ["handle"],
  handle: { relay: true },
  refusals: [],
  statics: {},
  traits: [],
};

/** A webhooks service with a relay and the commerce and billing services beside it. */
const WEBHOOKS_IR: MemberIR = {
  member: "webhooks",
  package: "@acme/service-webhooks",
  version: "0.1.0",
  layout: "service",
  modules: ["deliveries"],
  classes: [RELAY],
  shapes: [],
  enums: [],
  files: [],
  dependencies: [],
  errors: [],
  publishers: [
    { member: "billing", folder: "billing", manifest: buildManifest(BILLING_IR).manifest },
    { member: "commerce", folder: "commerce", manifest: buildManifest(COMMERCE_IR).manifest },
    // A second publisher of commerce's wire name is subscribed to once.
    { member: "copycat", folder: "copy-cat", manifest: buildManifest(COMMERCE_IR).manifest },
  ],
};

/** A listener of commerce's `OrderPaid`, imported from its generated client. */
const TYPED: DeclaredClass = {
  ...RELAY,
  name: "SyncOnOrderPaidListener",
  file: "src/modules/deliveries/listeners/sync-on-order-paid.listener.ts",
  importPath: "#modules/deliveries/listeners/sync-on-order-paid.listener",
  handle: { event: { name: "OrderPaid", from: "#stackra/clients/commerce" } },
};

/** Commerce beside the consumer, in a folder that is not its key. */
const COMMERCE_SERVICE: NonNullable<MemberIR["services"]> = [
  { member: "commerce", folder: "commerce-svc", manifest: buildManifest(COMMERCE_IR).manifest },
];

/** A service consuming commerce's `OrderPaid` (twice, and an event commerce does not publish). */
const SHIPPING_IR: MemberIR = {
  ...WEBHOOKS_IR,
  member: "shipping",
  package: "@acme/service-shipping",
  classes: [
    TYPED,
    { ...TYPED, name: "AuditOnOrderPaidListener" },
    {
      ...TYPED,
      name: "GhostListener",
      handle: { event: { name: "Ghost", from: "#stackra/clients/commerce" } },
    },
  ],
  publishers: [],
  services: COMMERCE_SERVICE,
};

describe("emitEncoreEvents", () => {
  it("emits one topic per integration event, registered under its wire name", () => {
    const [file, ...rest] = emitEncoreEvents(COMMERCE_IR, buildManifest(COMMERCE_IR).manifest);
    expect(rest).toEqual([]);
    expect(file?.path).toBe(".stackra/encore/commerce/events.ts");
    const content = file?.content ?? "";
    expect(content).toContain('import { Topic } from "encore.dev/pubsub";');
    expect(content).toContain(
      'export const eventOrdersOrderPaidV1 = new Topic<BrokerMessage>("commerce-event-orders-order-paid-v1", {',
    );
    expect(content).toContain('  { name: "orders.order.paid.v1", topic: eventOrdersOrderPaidV1 },');
  });

  it("subscribes a relay service to every integration topic of the product", () => {
    const files = emitEncoreEvents(WEBHOOKS_IR, buildManifest(WEBHOOKS_IR).manifest);
    expect(files.map((file) => file.path)).toEqual([".stackra/encore/webhooks/relay.ts"]);
    const content = files[0]?.content ?? "";
    expect(content).toContain(
      `import { eventOrdersOrderPaidV1 } from "${UP}commerce/.stackra/encore/commerce/events";`,
    );
    expect(content).toMatch(
      /import \{ event\w+ \} from "\.\.\/\.\.\/\.\.\/\.\.\/billing\/\.stackra\/encore\/billing\/events";/,
    );
    expect(content).not.toContain("copy-cat");
    expect(content).toContain(
      'export const eventOrdersOrderPaidV1Relay = new Subscription(eventOrdersOrderPaidV1, "webhooks-relay", {',
    );
    expect(content).toContain(
      "    await container.get(InboxService).receive(message.body as EventEnvelope);",
    );
    expect(content.match(/new Subscription\(eventOrdersOrderPaidV1,/g)).toHaveLength(1);
  });

  it("subscribes a publishing relay service to its own topics as well", () => {
    const ir: MemberIR = { ...COMMERCE_IR, classes: [...COMMERCE_IR.classes, RELAY] };
    const files = emitEncoreEvents(ir, buildManifest(ir).manifest);
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/encore/commerce/events.ts",
      ".stackra/encore/commerce/relay.ts",
    ]);
    expect(files[1]?.content).toContain('import { eventOrdersOrderPaidV1 } from "./events";');
  });

  it("subscribes a typed consumer to each consumed event on the producer's topic, once", () => {
    const files = emitEncoreEvents(SHIPPING_IR, buildManifest(SHIPPING_IR).manifest);
    expect(files.map((file) => file.path)).toEqual([".stackra/encore/shipping/subscriptions.ts"]);
    const content = files[0]?.content ?? "";
    expect(content).toContain(
      `import { eventOrdersOrderPaidV1 } from "${UP}commerce-svc/.stackra/encore/commerce/events";`,
    );
    expect(content).toContain(
      'export const eventOrdersOrderPaidV1Subscription = new Subscription(eventOrdersOrderPaidV1, "shipping-orders-order-paid-v1", {',
    );
    expect(content).toContain(
      "    await container.get(InboxService).receive(message.body as EventEnvelope);",
    );
    expect(content.match(/new Subscription\(/g)).toHaveLength(1);
  });

  it("subscribes a local listener of the service's own event on its own topic (STA-1302)", () => {
    const local: DeclaredClass = {
      ...RELAY,
      name: "NotifyOnOrderPaidListener",
      module: "orders",
      file: "src/modules/orders/listeners/notify-on-order-paid.listener.ts",
      importPath: "#modules/orders/listeners/notify-on-order-paid.listener",
      handle: { event: { name: "OrderPaid", from: "#modules/orders/events/order-paid.event" } },
    };
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [...COMMERCE_IR.classes, local, { ...local, name: "AuditOnOrderPaidListener" }],
    };
    const files = emitEncoreEvents(ir, buildManifest(ir).manifest);
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/encore/commerce/events.ts",
      ".stackra/encore/commerce/subscriptions.ts",
    ]);
    const content = files[1]?.content ?? "";
    expect(content).toContain('import { eventOrdersOrderPaidV1 } from "./events";');
    expect(content).toContain(
      'export const eventOrdersOrderPaidV1Subscription = new Subscription(eventOrdersOrderPaidV1, "commerce-orders-order-paid-v1", {',
    );
    expect(content.match(/new Subscription\(/g)).toHaveLength(1);
    // A relay already hears the own topic, so no second subscription is written.
    const relayed: MemberIR = { ...ir, classes: [...ir.classes, RELAY] };
    expect(
      emitEncoreEvents(relayed, buildManifest(relayed).manifest).map((file) => file.path),
    ).toEqual([".stackra/encore/commerce/events.ts", ".stackra/encore/commerce/relay.ts"]);
  });

  it("leaves a consumed event to the relay when the service relays", () => {
    const ir: MemberIR = { ...WEBHOOKS_IR, classes: [RELAY, TYPED], services: COMMERCE_SERVICE };
    const files = emitEncoreEvents(ir, buildManifest(ir).manifest);
    expect(files.map((file) => file.path)).toEqual([".stackra/encore/webhooks/relay.ts"]);
  });

  it("writes nothing for a package, an app, a quiet service or a relay with no topic to hear", () => {
    expect(emitEncoreEvents(LOYALTY_KIT_IR, buildManifest(LOYALTY_KIT_IR).manifest)).toEqual([]);
    expect(emitEncoreEvents(WEB_APP_IR, buildManifest(WEB_APP_IR).manifest)).toEqual([]);
    const lonely = { ...WEBHOOKS_IR, publishers: [] };
    expect(emitEncoreEvents(lonely, buildManifest(lonely).manifest)).toEqual([]);
  });
});
