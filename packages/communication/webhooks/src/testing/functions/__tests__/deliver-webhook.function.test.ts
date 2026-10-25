/**
 * Stackra file contract:
 * Purpose: unit tests of `deliverWebhook`: it rejects before a testing app compiled and for an unregistered event; on the
 *          compiled app a payload signed with the platform's secret is written to the app's outbox as its event, one
 *          signed with a wrong secret resolves to the `invalid_signature` refusal with nothing written, and one posted
 *          to a connection's URL verifies against that connection's secret and carries the connection.
 * Boundary: test only; a fixture module whose app has a test secret store, a connection store with one connection and
 *           a recording outbox put in place with `override`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0308 (rules 15 and 16).
 */
import { Secret, SecretStore } from "@stackra/config";
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { WebhookEvent } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import {
  AuthType,
  ConnectedAccount,
  Connection,
  ConnectionLevel,
  ConnectionStore,
  Integration,
  IntegrationCategory,
  InvalidSignatureError,
} from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { registerWebhookEvents, SignatureScheme } from "#core/index";
import "#testing/index";
import { deliverWebhook } from "#testing/functions/deliver-webhook.function";

const PLATFORM_SECRET = "test-platform-signing-secret";
const CONNECTION_SECRET = "test-connection-signing-secret";
const CONNECTION_ID = "conn_00000000000000000000000001";

class InboxIntegration extends Integration({
  provider: "inbox",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: {
    scheme: SignatureScheme.StandardWebhooks,
    secret: "{webhookSecret}",
    eventType: { path: "type" },
  },
}) {
  @Secret("INBOX_WEBHOOK_SECRET")
  webhookSecret!: string;
}

class InboxConnection extends Connection<InboxIntegration> {
  @Secret("INBOX_CONNECTION_WEBHOOK_SECRET")
  webhookSecret!: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "test-account" });
  }
}

class MailArrived extends WebhookEvent<InboxIntegration>({ type: "mail.arrived" }) {
  type!: string;

  mailId!: string;
}

class MailRead extends WebhookEvent<InboxIntegration>({ type: "mail.read" }) {}

registerSchemas([[MailArrived, z.object({ type: z.string(), mailId: z.string() })]]);
registerWebhookEvents([
  { event: MailArrived, integration: InboxIntegration, connection: InboxConnection },
]);

/** Answers the platform's test secret. */
class TestSecretStore extends SecretStore {
  get(name: string): string | undefined {
    return name === "INBOX_WEBHOOK_SECRET" ? PLATFORM_SECRET : undefined;
  }
}

class FixtureModule extends Module {}

registerWiring({ member: "fixture", root: FixtureModule, bindings: [] });

/** The fixture app with a test secret store, one stored connection and a recording outbox. */
async function compile() {
  const outbox = { write: vi.fn(async () => undefined) };
  const connections = {
    byId: vi.fn(async () => ({ webhookSecret: CONNECTION_SECRET })),
  };
  await createTestingModule(FixtureModule)
    .override(SecretStore, new TestSecretStore())
    .override(ConnectionStore, connections as unknown as ConnectionStore)
    .override(EventOutbox, outbox as unknown as EventOutbox)
    .compile();
  return { outbox };
}

const PAYLOAD = { type: "mail.arrived", mailId: "mail_1" };

describe(deliverWebhook, () => {
  it("rejects before a testing app compiled", async () => {
    await expect(deliverWebhook(MailArrived, PAYLOAD, { secret: PLATFORM_SECRET })).rejects.toThrow(
      "No testing app",
    );
  });

  it("writes the event of a payload signed with the platform's secret", async () => {
    const { outbox } = await compile();
    const result = await deliverWebhook(MailArrived, PAYLOAD, {
      secret: PLATFORM_SECRET,
      id: "msg_1",
    });
    expect(result).toMatchObject({ ok: true });
    const event = result.ok ? result.event : undefined;
    expect(event).toBeInstanceOf(MailArrived);
    expect(outbox.write.mock.calls[0]?.[0]).toMatchObject([{ event, meta: { id: "msg_1" } }]);
  });

  it("resolves to the invalid_signature refusal for a wrong secret and writes nothing", async () => {
    const { outbox } = await compile();
    const result = await deliverWebhook(MailArrived, PAYLOAD, { secret: "wrong" });
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error).toBeInstanceOf(InvalidSignatureError);
    expect(outbox.write).not.toHaveBeenCalled();
  });

  it("verifies a connection's URL against that connection's secret", async () => {
    const { outbox } = await compile();
    const platform = await deliverWebhook(MailArrived, PAYLOAD, {
      secret: PLATFORM_SECRET,
      connectionId: CONNECTION_ID,
    });
    expect(platform.ok).toBe(false);
    const own = await deliverWebhook(MailArrived, PAYLOAD, {
      secret: CONNECTION_SECRET,
      connectionId: CONNECTION_ID,
    });
    expect(own).toMatchObject({ ok: true });
    expect(outbox.write.mock.calls[0]?.[0]).toMatchObject([
      { meta: { connection: CONNECTION_ID } },
    ]);
  });

  it("rejects an event that is not registered", async () => {
    await compile();
    await expect(deliverWebhook(MailRead, {}, { secret: PLATFORM_SECRET })).rejects.toThrow(
      "MailRead is not registered",
    );
  });
});
