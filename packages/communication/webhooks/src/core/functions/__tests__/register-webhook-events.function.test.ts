/**
 * Stackra file contract:
 * Purpose: unit tests of `registerWebhookEvents`: a row is routed by its Integration and provider event type with the
 *          Integration's `webhooks` option and connection class; registering it again changes nothing; a class of the
 *          wrong kind, an Integration with no `webhooks` or an unknown scheme, a second connection class and a second
 *          class for one event type are refused.
 * Boundary: test only; the routing table is process-wide, so each case uses its own Integration.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rules 2, 15 and 16); ADR 0224 (decision 2).
 */
import { WebhookEvent } from "@stackra/events";
import {
  AuthType,
  ConnectedAccount,
  Connection,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
} from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { WEBHOOK_EVENTS } from "#core/constants/webhook-events.constant";
import { SignatureScheme } from "#core/enums/signature-scheme.enum";
import { registerWebhookEvents } from "#core/functions/register-webhook-events.function";

const WEBHOOKS = {
  scheme: SignatureScheme.StandardWebhooks,
  secret: "{webhookSecret}",
  eventType: { path: "type" },
} as const;

/** A fresh Integration with `webhooks`, so each case owns its routing. */
function integrationWith(provider: string, webhooks: object | undefined = WEBHOOKS) {
  return class extends Integration({
    provider,
    category: IntegrationCategory.Email,
    levels: [ConnectionLevel.Scope],
    auth: { type: AuthType.None },
    ...(webhooks === undefined ? {} : { webhooks: webhooks as typeof WEBHOOKS }),
  }) {};
}

/** A connection class. */
function connectionClass() {
  return class extends Connection {
    async check(): Promise<ConnectedAccount> {
      return ConnectedAccount.create({ id: "test-account" });
    }
  };
}

/** A webhook event class for provider event type `type`. */
function eventFor(type: string) {
  return class extends WebhookEvent<object>({ type }) {};
}

describe(registerWebhookEvents, () => {
  it("routes an event by its Integration and provider event type", () => {
    const MailIntegration = integrationWith("mail-routed");
    const MailConnection = connectionClass();
    const Received = eventFor("email.received");
    const Bounced = eventFor("email.bounced");
    registerWebhookEvents([
      { event: Received, integration: MailIntegration, connection: MailConnection },
      { event: Bounced, integration: MailIntegration },
    ]);
    const route = WEBHOOK_EVENTS.byIntegration.get(MailIntegration);
    expect(route?.webhooks).toEqual(WEBHOOKS);
    expect(route?.connection).toBe(MailConnection);
    expect(route?.types.get("email.received")).toBe(Received);
    expect(route?.types.get("email.bounced")).toBe(Bounced);
    expect(WEBHOOK_EVENTS.byEvent.get(Received)).toEqual({
      event: Received,
      integration: MailIntegration,
      connection: MailConnection,
    });
  });

  it("changes nothing when a row is registered again", () => {
    const MailIntegration = integrationWith("mail-again");
    const Received = eventFor("email.received");
    const row = { event: Received, integration: MailIntegration };
    registerWebhookEvents([row]);
    registerWebhookEvents([row]);
    expect([...(WEBHOOK_EVENTS.byIntegration.get(MailIntegration)?.types ?? [])]).toEqual([
      ["email.received", Received],
    ]);
  });

  it("refuses a class of the wrong kind", () => {
    const MailIntegration = integrationWith("mail-kinds");
    const Received = eventFor("email.received");
    class NotAnEvent {}
    expect(() =>
      registerWebhookEvents([{ event: NotAnEvent as never, integration: MailIntegration }]),
    ).toThrow("does not extend WebhookEvent");
    expect(() =>
      registerWebhookEvents([{ event: Received, integration: NotAnEvent as never }]),
    ).toThrow("does not extend Integration");
    expect(() =>
      registerWebhookEvents([
        { event: Received, integration: MailIntegration, connection: NotAnEvent as never },
      ]),
    ).toThrow("does not extend Connection");
  });

  it("refuses an Integration with no webhooks or an unknown scheme", () => {
    const Received = eventFor("email.received");
    expect(() =>
      registerWebhookEvents([
        { event: Received, integration: integrationWith("mail-none", undefined) },
      ]),
    ).toThrow("declares no webhooks option");
    expect(() =>
      registerWebhookEvents([
        {
          event: Received,
          integration: integrationWith("mail-stripe", { ...WEBHOOKS, scheme: "stripe" }),
        },
      ]),
    ).toThrow(RangeError);
  });

  it("refuses a second connection class and a second class for one event type", () => {
    const MailIntegration = integrationWith("mail-twice");
    registerWebhookEvents([
      {
        event: eventFor("email.received"),
        integration: MailIntegration,
        connection: connectionClass(),
      },
    ]);
    expect(() =>
      registerWebhookEvents([
        {
          event: eventFor("email.bounced"),
          integration: MailIntegration,
          connection: connectionClass(),
        },
      ]),
    ).toThrow("keep one connection class per integration");
    expect(() =>
      registerWebhookEvents([{ event: eventFor("email.received"), integration: MailIntegration }]),
    ).toThrow("both handle");
  });
});
