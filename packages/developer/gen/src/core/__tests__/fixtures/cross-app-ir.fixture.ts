/**
 * Stackra file contract:
 * Purpose: the cross-app relay fixtures (STA-1910): `PAY_CONTRACT`, the pinned manifest of a `pay` producer read from
 *          a contract package (one integration event and a `relay` section listing `billing`); `INBOX_IR`, a `billing`
 *          service with a listener of that event; `PRODUCER_IR`, a `pay` service whose runway has `events` blocks
 *          for `dev` and `prod`; `PLAIN_IR`, the same service without them; and `OUTBOX_MANIFEST`, the outbox's cross-app services, drivers and configs, so the
 *          wiring binds them.
 * Boundary: test data only; never imported by package code. Public keys are made-up base64url text, never a secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0511 (amendment of 2026-11-02).
 */
import type { StackraManifest } from "@stackra/contracts";

import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The outbox's cross-app part of its manifest: services, the four ports' drivers and the two configs. */
export const OUTBOX_MANIFEST: StackraManifest = {
  member: "outbox",
  package: "@stackra/outbox",
  version: "0.9.0",
  config: [
    { key: "outbox.events_relay", class: "EventsRelayConfig", from: "@stackra/outbox" },
    { key: "outbox.relay_inbox", class: "RelayInboxConfig", from: "@stackra/outbox" },
  ],
  services: [
    {
      class: "CrossAppFanOut",
      from: "@stackra/outbox/node",
      deps: [
        { class: { name: "SubscriberSource", from: "@stackra/outbox/contracts" } },
        { class: { name: "DeliveryDriver", from: "@stackra/outbox/contracts" } },
      ],
    },
    {
      class: "CrossAppRelayService",
      from: "@stackra/outbox/node",
      deps: [
        { class: { name: "DeliveryDriver", from: "@stackra/outbox/contracts" } },
        { class: { name: "SubscriberSource", from: "@stackra/outbox/contracts" } },
        { class: { name: "EventSigner", from: "@stackra/outbox/contracts" } },
      ],
    },
    {
      class: "RelayInboxService",
      from: "@stackra/outbox/node",
      deps: [
        { class: { name: "InboxVerifier", from: "@stackra/outbox/contracts" } },
        { class: { name: "RelayInboxConfig", from: "@stackra/outbox" } },
      ],
    },
  ],
  drivers: [
    {
      port: "SubscriberSource",
      key: "outbox.SubscriberSource",
      candidates: ["config"],
      classes: {
        config: {
          class: "ConfigSubscriberSourceDriver",
          from: "@stackra/outbox",
          deps: [{ class: { name: "EventsRelayConfig", from: "@stackra/outbox" } }],
        },
      },
    },
    {
      port: "EventSigner",
      key: "outbox.EventSigner",
      candidates: ["ed25519"],
      classes: {
        ed25519: {
          class: "Ed25519EventSignerDriver",
          from: "@stackra/outbox",
          deps: [{ class: { name: "EventsRelayConfig", from: "@stackra/outbox" } }],
        },
      },
    },
    {
      port: "InboxVerifier",
      key: "outbox.InboxVerifier",
      candidates: ["contract"],
      classes: {
        contract: {
          class: "ContractInboxVerifierDriver",
          from: "@stackra/outbox",
          deps: [{ class: { name: "RelayInboxConfig", from: "@stackra/outbox" } }],
        },
      },
    },
    {
      port: "DeliveryDriver",
      key: "outbox.DeliveryDriver",
      candidates: ["memory", "postgres"],
      classes: {
        memory: { class: "MemoryDeliveryDriver", from: "@stackra/outbox" },
        postgres: { class: "PostgresDeliveryDriver", from: "@stackra/outbox/node" },
      },
    },
  ],
};

/** The `pay` producer's pinned manifest, as its contract package ships it. */
export const PAY_CONTRACT: StackraManifest = {
  member: "pay",
  package: "@acme/service-pay",
  version: "1.2.0",
  events: [
    {
      name: "payments.payment.captured.v1",
      module: "payments",
      class: "PaymentCaptured",
      file: "src/modules/payments/events/payment-captured.event.ts",
      kind: "integration",
      version: 1,
    },
  ],
  relay: {
    keys: { dev: [{ id: "pay-dev-1", publicKey: "cGF5LWRldi1wdWJsaWM" }] },
    subscribers: { dev: [{ member: "billing", events: ["payments.payment.captured.v1"] }] },
  },
};

/** A listener of `PaymentCaptured` from `#stackra/clients/pay`. */
export const INBOX_LISTENER: DeclaredClass = {
  name: "BillOnPaymentCapturedListener",
  kind: "listener",
  module: "invoices",
  file: "src/modules/invoices/listeners/bill-on-payment-captured.listener.ts",
  importPath: "#modules/invoices/listeners/bill-on-payment-captured.listener",
  options: {},
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
  handle: { event: { name: "PaymentCaptured", from: "#stackra/clients/pay" } },
};

/** A bare service member. */
function service(member: string, more: Partial<MemberIR>): MemberIR {
  return {
    member,
    package: `@acme/service-${member}`,
    version: "0.1.0",
    layout: "service",
    modules: [member],
    classes: [],
    shapes: [],
    enums: [],
    files: [],
    packages: ["@stackra/app", "@stackra/outbox", "@stackra/events"],
    dependencies: [{ package: "@stackra/outbox", manifest: OUTBOX_MANIFEST }],
    errors: [],
    ...more,
  };
}

/** The `billing` consumer: a listener of the contract-only `pay` producer's event. */
export const INBOX_IR: MemberIR = service("billing", {
  modules: ["invoices"],
  classes: [INBOX_LISTENER],
  services: [{ member: "pay", package: "@acme/pay-contract", manifest: PAY_CONTRACT }],
});

/** The `pay` service with no runway `events` block and no cross-app listener. */
export const PLAIN_IR: MemberIR = service("pay", {});

/** The `pay` producer: runway `events` blocks for `dev` and `prod`. */
export const PRODUCER_IR: MemberIR = service("pay", {
  eventsRelay: {
    dev: {
      signingKey: "STACKRA_EVENTS_SIGNING_KEY",
      keys: [{ id: "pay-dev-1", publicKey: "cGF5LWRldi1wdWJsaWM" }],
      subscribers: [
        {
          member: "billing",
          inbox: "http://localhost:4012",
          events: ["payments.payment.captured.v1"],
        },
      ],
    },
    prod: {
      signingKey: "PAY_EVENTS_SIGNING_KEY",
      keys: [{ id: "pay-prod-1", publicKey: "cGF5LXByb2QtcHVibGlj" }],
      subscribers: [],
    },
  },
});
