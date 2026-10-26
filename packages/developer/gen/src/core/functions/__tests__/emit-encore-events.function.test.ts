/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreEvents`: a publishing service gets one Pub/Sub topic per integration event,
 *          registered under its wire name; a relay service also gets one subscription per integration topic of the
 *          product (its own and each publisher's, a shared wire name once) into its inbox; nothing for a package, an
 *          app, or a service that neither publishes nor relays.
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
      'import { eventOrdersOrderPaidV1 } from "../../../../commerce/.stackra/encore/commerce/events";',
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

  it("writes nothing for a package, an app, a quiet service or a relay with no topic to hear", () => {
    expect(emitEncoreEvents(LOYALTY_KIT_IR, buildManifest(LOYALTY_KIT_IR).manifest)).toEqual([]);
    expect(emitEncoreEvents(WEB_APP_IR, buildManifest(WEB_APP_IR).manifest)).toEqual([]);
    const lonely = { ...WEBHOOKS_IR, publishers: [] };
    expect(emitEncoreEvents(lonely, buildManifest(lonely).manifest)).toEqual([]);
  });
});
