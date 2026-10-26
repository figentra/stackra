/**
 * Stackra file contract:
 * Purpose: unit tests of `DeliverWebhookAction`: a job of the job actor retried for about three days into the
 *          dead-letter queue; a 2xx delivery is signed with the endpoint's secret (both during a rotation), posted with
 *          the exact body and logged as delivered; a failure status or no answer is logged and refused as retryable;
 *          a removed or disabled endpoint is skipped; a secret with no value posts nothing; a dead letter disables the
 *          endpoint; an `s3:` endpoint gets one object keyed by the event's day and id with the signed headers as
 *          metadata, and a refused write is logged and retried.
 * Boundary: test only; the services, the sender, the secret store and the clock are in-test fakes, and Web Crypto runs
 *           for real, so the posted signature is verified as a receiver would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decisions 2 and 3); ADR 0305 (rules 28 and 30); ADR 0173; ADR 0422
 *                     (decision 4).
 */
import type { ActionContext } from "@stackra/actions";
import type { SecretStore } from "@stackra/config/contracts";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { WebhookRequest, WebhookSender } from "#contracts/index";
import { verifyWebhook, WebhookDeliveryFailedError } from "#core/index";
import { DeliverWebhookAction } from "#node/actions/deliver-webhook.action";
import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import { DeliverWebhookInput } from "#node/schemas/deliver-webhook-input.schema";
import type { WebhookDeliveryService } from "#node/services/webhook-delivery.service";
import type { WebhookEndpointService } from "#node/services/webhook-endpoint.service";
import { WebhookObjectSinkFake } from "#testing/fakes/webhook-object-sink.fake";

const AT = new Date("2026-10-25T09:00:00Z");
const BODY = '{"type":"orders.order.paid.v1","timestamp":"2026-10-25T08:59:00.000Z","data":{}}';
const SECRETS: Readonly<Record<string, string>> = {
  ACME_WEBHOOK_SECRET_1: "test-old-signing-secret",
  ACME_WEBHOOK_SECRET_2: "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw", // gitleaks:allow -- reason: the published Standard Webhooks test vector, not a secret
};

/** A stored endpoint with `data`. */
const endpointOf = (data: Partial<WebhookEndpoint> = {}): WebhookEndpoint =>
  Object.assign(new WebhookEndpoint(), {
    scopeId: "scp_00000000000000000000000001",
    scopePath: "platform.acme",
    url: "https://hooks.acme.example/in",
    events: ["orders.order.paid.v1"],
    secretName: "ACME_WEBHOOK_SECRET_2",
    previousSecretName: null,
    rotatedAt: null,
    disabledAt: null,
    ...data,
  });

/** An action over fakes: `endpoint` is stored and the sender answers `answer`. */
function setup(
  endpoint: WebhookEndpoint | null,
  answer: number | Error = 204,
  objects = new WebhookObjectSinkFake(),
) {
  const sent: WebhookRequest[] = [];
  const endpoints = {
    findOne: vi.fn(async () => endpoint),
    disable: vi.fn(async () => undefined),
  };
  const deliveries = { record: vi.fn(async () => undefined) };
  const sender = {
    send: vi.fn(async (request: WebhookRequest) => {
      sent.push(request);
      if (answer instanceof Error) throw answer;
      return answer;
    }),
  };
  const secrets = { get: (name: string) => SECRETS[name] };
  const action = new DeliverWebhookAction(
    endpoints as unknown as WebhookEndpointService,
    deliveries as unknown as WebhookDeliveryService,
    sender as unknown as WebhookSender,
    secrets as unknown as SecretStore,
    { now: () => AT } as unknown as Clock,
    objects,
  );
  return { action, endpoints, deliveries, sent, objects };
}

/** The input of one delivery to `endpoint`. */
const inputFor = (endpoint: WebhookEndpoint) =>
  DeliverWebhookInput.create({
    endpointId: endpoint.id,
    eventId: "evt_1",
    type: "orders.order.paid.v1",
    body: BODY,
  });

const ctx = {
  now: () => AT,
  abortSignal: new AbortController().signal,
} as unknown as ActionContext;

describe(DeliverWebhookAction, () => {
  it("is a job of the job actor retried into the dead-letter queue", () => {
    const options = kindOf(DeliverWebhookAction)?.options;
    expect(options).toMatchObject({ key: "webhook_delivery.send", actors: [ActorKind.Job] });
    expect(options?.["job"]).toMatchObject({
      retries: 80,
      backoff: Backoff.Exponential,
      deadLetter: true,
      onDeadLetter: "disableEndpoint",
    });
  });

  it("signs, posts the exact body and logs a delivered attempt", async () => {
    const endpoint = endpointOf();
    const { action, deliveries, sent } = setup(endpoint);
    await expect(action.handle(inputFor(endpoint), ctx)).resolves.toBeUndefined();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ url: endpoint.url, body: BODY, signal: ctx.abortSignal });
    expect(sent[0]?.headers).toMatchObject({
      "content-type": "application/json",
      "webhook-id": "evt_1",
      "webhook-timestamp": String(AT.getTime() / 1000),
    });
    await expect(
      verifyWebhook(sent[0]?.headers ?? {}, BODY, [SECRETS["ACME_WEBHOOK_SECRET_2"] ?? ""], AT),
    ).resolves.toBe(true);
    expect(deliveries.record).toHaveBeenCalledWith({
      endpointId: endpoint.id,
      scopeId: endpoint.scopeId,
      scopePath: endpoint.scopePath,
      eventId: "evt_1",
      eventType: "orders.order.paid.v1",
      responseStatus: 204,
      isDelivered: true,
    });
  });

  it("signs with both secrets during a rotation", async () => {
    const endpoint = endpointOf({
      previousSecretName: "ACME_WEBHOOK_SECRET_1",
      rotatedAt: new Date(AT.getTime() - 3_600_000),
    });
    const { action, sent } = setup(endpoint);
    await action.handle(inputFor(endpoint), ctx);
    expect(sent[0]?.headers["webhook-signature"]?.split(" ")).toHaveLength(2);
    await expect(
      verifyWebhook(sent[0]?.headers ?? {}, BODY, [SECRETS["ACME_WEBHOOK_SECRET_1"] ?? ""], AT),
    ).resolves.toBe(true);
  });

  it("logs and refuses a failure status as retryable", async () => {
    const endpoint = endpointOf();
    const { action, deliveries } = setup(endpoint, 500);
    const failure = await action.handle(inputFor(endpoint), ctx).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WebhookDeliveryFailedError);
    expect(failure).toMatchObject({ status: 500, retryable: true });
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: 500, isDelivered: false }),
    );
  });

  it("logs and refuses an endpoint that does not answer, or answers with a redirect", async () => {
    const endpoint = endpointOf();
    const down = setup(endpoint, new TypeError("fetch failed"));
    await expect(down.action.handle(inputFor(endpoint), ctx)).rejects.toMatchObject({
      status: null,
    });
    expect(down.deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: null, isDelivered: false }),
    );
    const moved = setup(endpoint, 301);
    await expect(moved.action.handle(inputFor(endpoint), ctx)).rejects.toBeInstanceOf(
      WebhookDeliveryFailedError,
    );
  });

  it("skips an endpoint removed or disabled since the job was queued", async () => {
    const removed = setup(null);
    await removed.action.handle(inputFor(endpointOf()), ctx);
    expect(removed.sent).toEqual([]);
    const disabled = endpointOf({ disabledAt: AT });
    const off = setup(disabled);
    await off.action.handle(inputFor(disabled), ctx);
    expect(off.sent).toEqual([]);
    expect(off.deliveries.record).not.toHaveBeenCalled();
  });

  it("posts nothing when a signing secret has no value", async () => {
    const endpoint = endpointOf({ secretName: "ACME_WEBHOOK_SECRET_MISSING" });
    const { action, sent } = setup(endpoint);
    await expect(action.handle(inputFor(endpoint), ctx)).rejects.toThrow(
      "ACME_WEBHOOK_SECRET_MISSING has no value",
    );
    expect(sent).toEqual([]);
  });

  it("disables the endpoint after a dead letter", async () => {
    const endpoint = endpointOf();
    const { action, endpoints } = setup(endpoint);
    await action.disableEndpoint(inputFor(endpoint));
    expect(endpoints.disable).toHaveBeenCalledWith(endpoint.id, AT);
  });

  it("writes an s3 endpoint's delivery as one signed object", async () => {
    const endpoint = endpointOf({ url: "s3://acme-siem/stackra?region=me-central-1" });
    const { action, deliveries, sent, objects } = setup(endpoint);
    await action.handle(inputFor(endpoint), ctx);
    expect(sent).toEqual([]);
    const object = objects.object(
      "acme-siem",
      "stackra/orders.order.paid.v1/2026/10/25/evt_1.json",
    );
    expect(object).toMatchObject({ region: "me-central-1", body: BODY });
    expect(object?.metadata).toMatchObject({ "webhook-id": "evt_1" });
    await expect(
      verifyWebhook(object?.metadata ?? {}, BODY, [SECRETS["ACME_WEBHOOK_SECRET_2"] ?? ""], AT),
    ).resolves.toBe(true);
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: null, isDelivered: true }),
    );
  });

  it("logs and refuses a refused object write, so the queue retries it", async () => {
    const endpoint = endpointOf({ url: "s3://acme-siem/stackra" });
    const { action, deliveries } = setup(
      endpoint,
      204,
      new WebhookObjectSinkFake().failWith(new Error("AccessDenied")),
    );
    await expect(action.handle(inputFor(endpoint), ctx)).rejects.toBeInstanceOf(
      WebhookDeliveryFailedError,
    );
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: null, isDelivered: false }),
    );
  });
});
