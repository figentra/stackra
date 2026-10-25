/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookReceiver`: a platform delivery verifies against the Integration's `@Secret` field and
 *          a connection's against that connection's secret field, with no fallback either way; a verified delivery is
 *          written to the outbox as its event class, keyed by the webhook id, with the connection in its metadata;
 *          Svix header names verify; an unknown event type is dropped; an unknown Integration, a connection URL of a
 *          platform-only Integration and a bad signature are refused before anything is written.
 * Boundary: test only; the connection store, the outbox and the clock are in-test fakes, the secret store a map of test
 *           values, and Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rules 15, 16 and 20); ADR 0078 (decision 4).
 */
import { Secret } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import type { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { WebhookEvent } from "@stackra/events";
import type { EventOutbox } from "@stackra/events/contracts";
import {
  AuthType,
  ConnectedAccount,
  Connection,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  InvalidSignatureError,
} from "@stackra/integrations";
import type { ConnectionStore } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { SignatureScheme } from "#core/enums/signature-scheme.enum";
import { registerWebhookEvents } from "#core/functions/register-webhook-events.function";
import { signWebhook } from "#core/functions/sign-webhook.function";
import { WebhookReceiver } from "#core/services/webhook-receiver.service";

const PLATFORM_SECRET = "test-platform-signing-secret";
const CONNECTION_SECRET = "test-connection-signing-secret";
const CONNECTION_ID = "conn_00000000000000000000000001";
const SENT = new Date("2026-10-25T09:00:00Z");

const WEBHOOKS = {
  scheme: SignatureScheme.StandardWebhooks,
  secret: "{webhookSecret}",
  eventType: { path: "event.name" },
} as const;

class InboxIntegration extends Integration({
  provider: "inbox",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: WEBHOOKS,
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

class StatusIntegration extends Integration({
  provider: "status",
  category: IntegrationCategory.Other,
  levels: [],
  auth: { type: AuthType.None },
  webhooks: WEBHOOKS,
}) {
  @Secret("STATUS_WEBHOOK_SECRET")
  webhookSecret!: string;
}

class MailArrived extends WebhookEvent<InboxIntegration>({ type: "mail.arrived" }) {
  event!: { name: string };

  mailId!: string;
}

class StatusChanged extends WebhookEvent<StatusIntegration>({ type: "status.changed" }) {
  event!: { name: string };
}

registerSchemas([
  [MailArrived, z.object({ event: z.object({ name: z.string() }), mailId: z.string() })],
  [StatusChanged, z.object({ event: z.object({ name: z.string() }) })],
]);
registerWebhookEvents([
  { event: MailArrived, integration: InboxIntegration, connection: InboxConnection },
  { event: StatusChanged, integration: StatusIntegration },
]);

/** Answers the platform's test secrets by name. */
class TestSecretStore extends SecretStore {
  get(name: string): string | undefined {
    return name === "INBOX_WEBHOOK_SECRET" || name === "STATUS_WEBHOOK_SECRET"
      ? PLATFORM_SECRET
      : undefined;
  }
}

/** A receiver over fakes: one stored connection with its own secret, a recording outbox and a frozen clock. */
function setup() {
  const connections = {
    byId: vi.fn(async (_type: unknown, id: string) => {
      if (id !== CONNECTION_ID) throw NotFoundError.create();
      return { webhookSecret: CONNECTION_SECRET };
    }),
  };
  const outbox = { write: vi.fn(async () => undefined) };
  const clock = { now: () => SENT };
  const receiver = new WebhookReceiver(
    connections as unknown as ConnectionStore,
    new TestSecretStore(),
    outbox as unknown as EventOutbox,
    clock as unknown as Clock,
  );
  return { receiver, connections, outbox };
}

/** A body of event type `name`, signed with `secret` as message `id`. */
async function delivery(name: string, secret: string, id = "msg_1") {
  const body = JSON.stringify({ event: { name }, mailId: "mail_1" });
  const headers = await signWebhook({ id, timestamp: SENT, body }, [secret]);
  return { headers: { ...headers }, body };
}

describe(WebhookReceiver, () => {
  it("verifies a platform delivery against the Integration's secret and writes its event", async () => {
    const { receiver, outbox, connections } = setup();
    const event = await receiver.receive({
      integration: InboxIntegration,
      ...(await delivery("mail.arrived", PLATFORM_SECRET)),
    });
    expect(event).toBeInstanceOf(MailArrived);
    expect(event).toMatchObject({ mailId: "mail_1" });
    expect(outbox.write).toHaveBeenCalledWith([{ event, meta: { id: "msg_1", occurredAt: SENT } }]);
    expect(connections.byId).not.toHaveBeenCalled();
  });

  it("verifies a connection's delivery against its own secret and marks the connection", async () => {
    const { receiver, outbox, connections } = setup();
    const event = await receiver.receive({
      integration: InboxIntegration,
      connectionId: CONNECTION_ID,
      ...(await delivery("mail.arrived", CONNECTION_SECRET)),
    });
    expect(connections.byId).toHaveBeenCalledWith(InboxConnection, CONNECTION_ID);
    expect(outbox.write).toHaveBeenCalledWith([
      { event, meta: { id: "msg_1", occurredAt: SENT, connection: CONNECTION_ID } },
    ]);
  });

  it("never falls back: a platform-signed delivery to a connection's URL is refused, and the reverse", async () => {
    const { receiver, outbox } = setup();
    await expect(
      receiver.receive({
        integration: InboxIntegration,
        connectionId: CONNECTION_ID,
        ...(await delivery("mail.arrived", PLATFORM_SECRET)),
      }),
    ).rejects.toBeInstanceOf(InvalidSignatureError);
    await expect(
      receiver.receive({
        integration: InboxIntegration,
        ...(await delivery("mail.arrived", CONNECTION_SECRET)),
      }),
    ).rejects.toBeInstanceOf(InvalidSignatureError);
    expect(outbox.write).not.toHaveBeenCalled();
  });

  it("refuses a tampered body before parsing it", async () => {
    const { receiver, outbox } = setup();
    const { headers } = await delivery("mail.arrived", PLATFORM_SECRET);
    await expect(
      receiver.receive({ integration: InboxIntegration, headers, body: "not json" }),
    ).rejects.toBeInstanceOf(InvalidSignatureError);
    expect(outbox.write).not.toHaveBeenCalled();
  });

  it("reads Svix header names and keys the event by the Svix id", async () => {
    const { receiver, outbox } = setup();
    const { headers, body } = await delivery("mail.arrived", PLATFORM_SECRET, "msg_svix");
    await receiver.receive({
      integration: InboxIntegration,
      headers: {
        "svix-id": headers["webhook-id"],
        "svix-timestamp": headers["webhook-timestamp"],
        "svix-signature": headers["webhook-signature"],
      },
      body,
    });
    expect(outbox.write.mock.calls[0]?.[0]).toMatchObject([{ meta: { id: "msg_svix" } }]);
  });

  it("acknowledges and drops an event type no class handles", async () => {
    const { receiver, outbox } = setup();
    await expect(
      receiver.receive({
        integration: InboxIntegration,
        ...(await delivery("mail.deleted", PLATFORM_SECRET)),
      }),
    ).resolves.toBeUndefined();
    expect(outbox.write).not.toHaveBeenCalled();
  });

  it("refuses a connection URL of a platform-only Integration and an unknown connection", async () => {
    const { receiver } = setup();
    await expect(
      receiver.receive({
        integration: StatusIntegration,
        connectionId: CONNECTION_ID,
        ...(await delivery("status.changed", PLATFORM_SECRET)),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      receiver.receive({
        integration: InboxIntegration,
        connectionId: "conn_00000000000000000000000009",
        ...(await delivery("mail.arrived", CONNECTION_SECRET)),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses an Integration with no registered webhook event", async () => {
    class SilentIntegration extends Integration({
      provider: "silent",
      category: IntegrationCategory.Other,
      levels: [],
      auth: { type: AuthType.None },
    }) {}
    const { receiver } = setup();
    await expect(
      receiver.receive({
        integration: SilentIntegration,
        ...(await delivery("mail.arrived", PLATFORM_SECRET)),
      }),
    ).rejects.toThrow("SilentIntegration has no registered webhook event");
  });
});
