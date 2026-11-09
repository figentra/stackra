/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookReceiver`: a platform delivery verifies against the Integration's `@Secret` field and
 *          a connection's against that connection's secret field, with no fallback either way; a verified delivery is
 *          written to the outbox as its event class, keyed by the webhook id, with the connection in its metadata;
 *          Svix header names verify; an `hmac` Integration verifies by its recipe and keys the event by the payload's
 *          id, or by several payload paths and headers joined, refusing the event when a named part is missing (two
 *          events that differ only by state get different ids), or by its id header, refusing a delivery without it; an
 *          `aes_gcm_body` Integration (a regional gateway scheme, STA-1357) is parsed from its plaintext and
 *          keyed by the payload's numeric id; a `keyed_field_digest` Integration whose recipe reads a form-encoded body
 *          routes, keys and creates its event from the percent-decoded form fields, and a form body that fails
 *          verification is refused; an unknown event type is dropped; an unknown Integration, a connection URL of a platform-only
 *          Integration and a bad signature are refused before anything is written.
 * Boundary: test only; the connection store, the outbox and the clock are in-test fakes, the secret store a map of test
 *           values, and Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rules 15, 16 and 20); ADR 0078 (decision 4); stackra-223 (`tolerance`).
 */
import { Secret } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";
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
  WebhookEventIdMissingError,
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

/**
 * A hosted connector package's Integration and Connection, as a host's registrations import them from the package's
 * public entry: the receiver only ever sees the registered row, so the row's `connection` is what makes the URL route.
 */
class HostedInboxIntegration extends Integration({
  provider: "hosted_inbox",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: WEBHOOKS,
}) {
  @Secret("HOSTED_INBOX_WEBHOOK_SECRET")
  webhookSecret!: string;
}

/** The hosted package's Connection, paired with its Integration by the package manifest. */
class HostedInboxConnection extends Connection<HostedInboxIntegration> {
  @Secret("HOSTED_INBOX_CONNECTION_WEBHOOK_SECRET")
  webhookSecret!: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "test-hosted-account" });
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

class GatewayIntegration extends Integration({
  provider: "gateway",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: {
    scheme: SignatureScheme.Hmac,
    secret: "{webhookSecret}",
    eventType: { path: "type" },
    eventId: { path: "id" },
    signature: {
      header: "gateway-signature",
      parts: { separator: ",", assign: "=", signature: "v1", timestamp: "t" },
      algorithm: "SHA-256",
      encoding: "hex",
      payload: "{timestamp}.{body}",
      tolerance: Duration.minutes(5),
    },
  },
}) {
  @Secret("GATEWAY_WEBHOOK_SECRET")
  webhookSecret!: string;
}

/** A courier that numbers no event: the order, its state and the signed timestamp name one. */
class CourierIntegration extends Integration({
  provider: "courier",
  category: IntegrationCategory.Shipping,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: {
    scheme: SignatureScheme.Hmac,
    secret: "{webhookSecret}",
    eventType: { path: "event" },
    eventId: { parts: [{ path: "order.id" }, { path: "state" }, { header: "courier-timestamp" }] },
    signature: {
      header: "courier-signature",
      timestampHeader: "courier-timestamp",
      algorithm: "SHA-256",
      encoding: "hex",
      payload: "{timestamp}.{body}",
      tolerance: Duration.minutes(5),
    },
  },
}) {
  @Secret("COURIER_WEBHOOK_SECRET")
  webhookSecret!: string;
}

/** A depot that numbers each delivery in a header and names nothing in its payload. */
class DepotIntegration extends Integration({
  provider: "depot",
  category: IntegrationCategory.Shipping,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: {
    scheme: SignatureScheme.Hmac,
    secret: "{webhookSecret}",
    eventType: { path: "event" },
    signature: {
      header: "depot-signature",
      timestampHeader: "depot-timestamp",
      idHeader: "depot-delivery-id",
      algorithm: "SHA-256",
      encoding: "hex",
      payload: "{timestamp}.{body}",
      tolerance: Duration.minutes(5),
    },
  },
}) {
  @Secret("DEPOT_WEBHOOK_SECRET")
  webhookSecret!: string;
}

class SealedIntegration extends Integration({
  provider: "sealed",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  webhooks: {
    scheme: SignatureScheme.AesGcmBody,
    secret: "{webhookSecret}",
    eventType: { path: "type" },
    eventId: { path: "payload.id" },
    recipe: { ivHeader: "x-initialization-vector", tagHeader: "x-authentication-tag" },
  },
}) {
  @Secret("SEALED_WEBHOOK_SECRET")
  webhookSecret!: string;
}

/** A provider whose notifications are form-encoded: a SHA-256 digest of three fields and the secret, at `signature`. */
class FormIntegration extends Integration({
  provider: "form",
  category: IntegrationCategory.Payments,
  levels: [],
  auth: { type: AuthType.None },
  webhooks: {
    scheme: SignatureScheme.KeyedFieldDigest,
    secret: "{webhookSecret}",
    eventType: { path: "kind" },
    eventId: { path: "ref" },
    recipe: {
      path: "signature",
      fields: ["ref", "kind", "note"],
      algorithm: "SHA-256",
      bodyFormat: "form",
    },
  },
}) {
  @Secret("FORM_WEBHOOK_SECRET")
  webhookSecret!: string;
}

class FormPaid extends WebhookEvent<FormIntegration>({ type: "paid" }) {
  ref!: string;

  kind!: string;

  note!: string;
}

/** The sealed gateway's hex AES-256 key (a test value). */
const SEALED_KEY = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

class SealedPaid extends WebhookEvent<SealedIntegration>({ type: "PAYMENT" }) {
  type!: string;

  payload!: { id: number };
}

class PaymentSucceeded extends WebhookEvent<GatewayIntegration>({ type: "payment.succeeded" }) {
  id!: string;

  type!: string;
}

class CourierUpdated extends WebhookEvent<CourierIntegration>({ type: "order.updated" }) {
  event!: string;

  order!: { id: string };

  state?: string;
}

class ParcelMoved extends WebhookEvent<DepotIntegration>({ type: "parcel.moved" }) {
  event!: string;
}

class MailArrived extends WebhookEvent<InboxIntegration>({ type: "mail.arrived" }) {
  event!: { name: string };

  mailId!: string;
}

/** A hosted package's event, as its manifest lists it with its Integration and Connection. */
class HostedMailArrived extends WebhookEvent<HostedInboxIntegration>({ type: "mail.arrived" }) {
  event!: { name: string };

  mailId!: string;
}

class StatusChanged extends WebhookEvent<StatusIntegration>({ type: "status.changed" }) {
  event!: { name: string };
}

registerSchemas([
  [MailArrived, z.object({ event: z.object({ name: z.string() }), mailId: z.string() })],
  [HostedMailArrived, z.object({ event: z.object({ name: z.string() }), mailId: z.string() })],
  [StatusChanged, z.object({ event: z.object({ name: z.string() }) })],
  [PaymentSucceeded, z.object({ id: z.string(), type: z.string() })],
  [SealedPaid, z.object({ type: z.string(), payload: z.object({ id: z.number() }) })],
  [FormPaid, z.object({ ref: z.string(), kind: z.string(), note: z.string() })],
  [ParcelMoved, z.object({ event: z.string() })],
  [
    CourierUpdated,
    z.object({
      event: z.string(),
      order: z.object({ id: z.string() }),
      state: z.string().optional(),
    }),
  ],
]);
registerWebhookEvents([
  { event: MailArrived, integration: InboxIntegration, connection: InboxConnection },
  // the row gen writes from a hosted package's manifest `webhookEvents`
  {
    event: HostedMailArrived,
    integration: HostedInboxIntegration,
    connection: HostedInboxConnection,
  },
  { event: StatusChanged, integration: StatusIntegration },
  { event: PaymentSucceeded, integration: GatewayIntegration },
  { event: SealedPaid, integration: SealedIntegration },
  { event: FormPaid, integration: FormIntegration },
  { event: CourierUpdated, integration: CourierIntegration },
  { event: ParcelMoved, integration: DepotIntegration },
]);

/** Answers the platform's test secrets by name. */
class TestSecretStore extends SecretStore {
  get(name: string): string | undefined {
    return name === "INBOX_WEBHOOK_SECRET" ||
      name === "STATUS_WEBHOOK_SECRET" ||
      name === "GATEWAY_WEBHOOK_SECRET" ||
      name === "FORM_WEBHOOK_SECRET" ||
      name === "COURIER_WEBHOOK_SECRET" ||
      name === "DEPOT_WEBHOOK_SECRET"
      ? PLATFORM_SECRET
      : name === "SEALED_WEBHOOK_SECRET"
        ? SEALED_KEY
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
  const outbox = { write: vi.fn<EventOutbox["write"]>(async () => undefined) };
  const clock = { now: () => SENT };
  const receiver = new WebhookReceiver(
    connections as unknown as ConnectionStore,
    new TestSecretStore(),
    outbox as unknown as EventOutbox,
    clock as unknown as Clock,
  );
  return { receiver, connections, outbox };
}

/** The bytes of a hex text. */
const bytes = (hex: string) =>
  new Uint8Array(hex.match(/../g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
/** The hex of `data`. */
const toHex = (data: Uint8Array) =>
  Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** A body of event type `name`, signed with `secret` as message `id`. */
async function delivery(name: string, secret: string, id = "msg_1") {
  const body = JSON.stringify({ event: { name }, mailId: "mail_1" });
  const headers = await signWebhook({ id, timestamp: SENT, body }, [secret]);
  return { headers: { ...headers }, body };
}

/** A form-encoded body of `fields`, percent-encoded, signed over their decoded values and `secret`. */
async function formDelivery(fields: { ref: string; kind: string; note: string }, secret: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${fields.ref}${fields.kind}${fields.note}${secret}`),
    ),
  );
  const signed = { ...fields, signature: toHex(digest) };
  const body = Object.entries(signed)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return { headers: {}, body };
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

  it("verifies an hmac Integration by its recipe and keys the event by the payload's id", async () => {
    const { receiver, outbox } = setup();
    const body = JSON.stringify({ id: "evt_1", type: "payment.succeeded" });
    const t = String(SENT.getTime() / 1000);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(PLATFORM_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)),
    );
    const hex = Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const event = await receiver.receive({
      integration: GatewayIntegration,
      headers: { "gateway-signature": `t=${t},v1=${hex}` },
      body,
    });
    expect(event).toBeInstanceOf(PaymentSucceeded);
    expect(outbox.write).toHaveBeenCalledWith([{ event, meta: { id: "evt_1", occurredAt: SENT } }]);
    await expect(
      receiver.receive({
        integration: GatewayIntegration,
        headers: { "gateway-signature": `t=${t},v1=${"0".repeat(64)}` },
        body,
      }),
    ).rejects.toBeInstanceOf(InvalidSignatureError);
  });

  it("keys a courier event by its named parts, so two states of one order are two events", async () => {
    const { receiver, outbox } = setup();
    const t = String(SENT.getTime() / 1000);
    const send = async (payload: object) => {
      const body = JSON.stringify(payload);
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(PLATFORM_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const mac = new Uint8Array(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)),
      );
      return receiver.receive({
        integration: CourierIntegration,
        headers: { "courier-signature": toHex(mac), "courier-timestamp": t },
        body,
      });
    };

    await send({ event: "order.updated", order: { id: "ord_1" }, state: "picked_up" });
    await send({ event: "order.updated", order: { id: "ord_1" }, state: "delivered" });

    const ids = outbox.write.mock.calls.map(([written]) => written[0]?.meta.id);
    expect(ids).toEqual([`ord_1:picked_up:${t}`, `ord_1:delivered:${t}`]);
    await expect(send({ event: "order.updated", order: { id: "ord_1" } })).rejects.toBeInstanceOf(
      WebhookEventIdMissingError,
    );
    expect(outbox.write).toHaveBeenCalledTimes(2);
  });

  it("refuses an event whose one named id path is missing, never keying it by an empty id", async () => {
    const { receiver, outbox } = setup();
    const body = JSON.stringify({ type: "payment.succeeded" });
    const t = String(SENT.getTime() / 1000);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(PLATFORM_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)),
    );

    await expect(
      receiver.receive({
        integration: GatewayIntegration,
        headers: { "gateway-signature": `t=${t},v1=${toHex(mac)}` },
        body,
      }),
    ).rejects.toBeInstanceOf(WebhookEventIdMissingError);
    expect(outbox.write).not.toHaveBeenCalled();
  });

  it("keys a depot event by its id header and refuses a delivery without it", async () => {
    const { receiver, outbox } = setup();
    const t = String(SENT.getTime() / 1000);
    const body = JSON.stringify({ event: "parcel.moved" });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(PLATFORM_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)),
    );
    const signed = { "depot-signature": toHex(mac), "depot-timestamp": t };

    await receiver.receive({
      integration: DepotIntegration,
      headers: { ...signed, "depot-delivery-id": "dlv_1" },
      body,
    });

    expect(outbox.write.mock.calls[0]?.[0][0]?.meta.id).toBe("dlv_1");
    await expect(
      receiver.receive({ integration: DepotIntegration, headers: signed, body }),
    ).rejects.toBeInstanceOf(WebhookEventIdMissingError);
    expect(outbox.write).toHaveBeenCalledTimes(1);
  });

  it("parses an aes_gcm_body delivery from its plaintext and keys it by the payload's numeric id", async () => {
    const { receiver, outbox } = setup();
    const plain = JSON.stringify({ type: "PAYMENT", payload: { id: 42 } });
    const iv = "0102030405060708090a0b0c";
    const key = await crypto.subtle.importKey(
      "raw",
      bytes(SEALED_KEY),
      { name: "AES-GCM" },
      false,
      ["encrypt"],
    );
    const sealed = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: bytes(iv) },
        key,
        new TextEncoder().encode(plain),
      ),
    );
    const headers = {
      "x-initialization-vector": iv,
      "x-authentication-tag": toHex(sealed.slice(-16)),
    };
    const event = await receiver.receive({
      integration: SealedIntegration,
      headers,
      body: toHex(sealed.slice(0, -16)),
    });
    expect(event).toBeInstanceOf(SealedPaid);
    expect(outbox.write).toHaveBeenCalledWith([{ event, meta: { id: "42", occurredAt: SENT } }]);
    await expect(
      receiver.receive({
        integration: SealedIntegration,
        headers,
        body: toHex(sealed.slice(1, -16)),
      }),
    ).rejects.toBeInstanceOf(InvalidSignatureError);
  });

  it("routes a verified form-encoded delivery by a form field and creates its event from the form fields", async () => {
    const { receiver, outbox } = setup();
    const event = await receiver.receive({
      integration: FormIntegration,
      ...(await formDelivery({ ref: "R1", kind: "paid", note: "ok" }, PLATFORM_SECRET)),
    });
    expect(event).toBeInstanceOf(FormPaid);
    expect(event).toMatchObject({ ref: "R1", kind: "paid", note: "ok" });
    expect(outbox.write).toHaveBeenCalledWith([{ event, meta: { id: "R1", occurredAt: SENT } }]);
  });

  it("percent-decodes a form-encoded value", async () => {
    const { receiver } = setup();
    const { headers, body } = await formDelivery(
      { ref: "R2", kind: "paid", note: "paid in full & settled" },
      PLATFORM_SECRET,
    );
    expect(body).toContain("note=paid%20in%20full%20%26%20settled");
    const event = await receiver.receive({ integration: FormIntegration, headers, body });
    expect(event).toMatchObject({ note: "paid in full & settled" });
  });

  it("refuses a form-encoded delivery that fails verification before parsing it", async () => {
    const { receiver, outbox } = setup();
    const { headers, body } = await formDelivery(
      { ref: "R3", kind: "paid", note: "ok" },
      PLATFORM_SECRET,
    );
    await expect(
      receiver.receive({
        integration: FormIntegration,
        headers,
        body: body.replace("note=ok", "note=changed"),
      }),
    ).rejects.toBeInstanceOf(InvalidSignatureError);
    await expect(
      receiver.receive({
        integration: FormIntegration,
        ...(await formDelivery({ ref: "R3", kind: "paid", note: "ok" }, CONNECTION_SECRET)),
      }),
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

  /** The 404 a hosted Connection used to get: its row now carries the Connection, so its connection URL routes. */
  it("routes a connection URL of a hosted package's Integration through its registered Connection", async () => {
    const { receiver, outbox, connections } = setup();
    const event = await receiver.receive({
      integration: HostedInboxIntegration,
      connectionId: CONNECTION_ID,
      ...(await delivery("mail.arrived", CONNECTION_SECRET)),
    });
    expect(event).toBeInstanceOf(HostedMailArrived);
    expect(connections.byId).toHaveBeenCalledWith(HostedInboxConnection, CONNECTION_ID);
    expect(outbox.write).toHaveBeenCalledWith([
      { event, meta: { id: "msg_1", occurredAt: SENT, connection: CONNECTION_ID } },
    ]);
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
