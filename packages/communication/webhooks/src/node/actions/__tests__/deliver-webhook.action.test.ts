/**
 * Stackra file contract:
 * Purpose: unit tests of `DeliverWebhookAction`: a job of the job actor retried for about three days into the
 *          dead-letter queue; a 2xx delivery is signed with the receiver's secrets (both during a rotation), posted
 *          with the exact body and logged as delivered; a failure status or no answer is logged and refused as
 *          retryable; a removed or disabled receiver is skipped; a store that cannot resolve a secret posts nothing; a
 *          dead letter disables the receiver; an `s3:` receiver gets one signed object, and a refused write is logged
 *          and retried; a host store's receiver (a partner lead target) runs through the same job.
 * Boundary: test only; the endpoint store, the delivery log, the sender and the clock are in-test fakes, and Web
 *           Crypto runs for real, so the posted signature is verified as a receiver would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decisions 2 and 3); ADR 0305 (rules 28 and 30); ADR 0173; ADR 0422
 *                     (decision 4).
 */
import type { ActionContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type {
  WebhookDeliveryLog,
  WebhookDeliveryTarget,
  WebhookEndpointStore,
  WebhookRequest,
  WebhookSender,
} from "#contracts/index";
import { verifyWebhook, WebhookDeliveryFailedError } from "#core/index";
import { DeliverWebhookAction } from "#node/actions/deliver-webhook.action";
import { DeliverWebhookInput } from "#node/schemas/deliver-webhook-input.schema";
import { WebhookObjectSinkFake } from "#testing/fakes/webhook-object-sink.fake";

const AT = new Date("2026-10-25T09:00:00Z");
const BODY = '{"type":"orders.order.paid.v1","timestamp":"2026-10-25T08:59:00.000Z","data":{}}';
const OLD_SECRET = "test-old-signing-secret";
const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw"; // gitleaks:allow -- reason: the published Standard Webhooks test vector, not a secret

/** A receiver with `data`. */
const targetOf = (data: Partial<WebhookDeliveryTarget> = {}): WebhookDeliveryTarget => ({
  id: "whe_01j9z3k4m5n6p7q8r9s0t1v2w1",
  scope: { id: "scp_00000000000000000000000001", path: "platform.acme" },
  url: "https://hooks.acme.example/in",
  secrets: [SECRET],
  ...data,
});

/** An action over fakes: the store answers `target` and the sender answers `answer`. */
function setup(
  target: WebhookDeliveryTarget | null | Error,
  answer: number | Error = 204,
  objects = new WebhookObjectSinkFake(),
) {
  const sent: WebhookRequest[] = [];
  const endpoints = {
    target: vi.fn(async () => {
      if (target instanceof Error) throw target;
      return target;
    }),
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
  const action = new DeliverWebhookAction(
    endpoints as unknown as WebhookEndpointStore,
    deliveries as unknown as WebhookDeliveryLog,
    sender as unknown as WebhookSender,
    { now: () => AT } as unknown as Clock,
    objects,
  );
  return { action, endpoints, deliveries, sent, objects };
}

/** The input of one delivery to receiver `id`. */
const inputFor = (id = targetOf().id) =>
  DeliverWebhookInput.create({
    endpointId: id,
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
    const target = targetOf();
    const { action, endpoints, deliveries, sent } = setup(target);
    await expect(action.handle(inputFor(), ctx)).resolves.toBeUndefined();
    expect(endpoints.target).toHaveBeenCalledWith(target.id, AT);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ url: target.url, body: BODY, signal: ctx.abortSignal });
    expect(sent[0]?.headers).toMatchObject({
      "content-type": "application/json",
      "webhook-id": "evt_1",
      "webhook-timestamp": String(AT.getTime() / 1000),
    });
    await expect(verifyWebhook(sent[0]?.headers ?? {}, BODY, [SECRET], AT)).resolves.toBe(true);
    expect(deliveries.record).toHaveBeenCalledWith({
      endpointId: target.id,
      scope: target.scope,
      eventId: "evt_1",
      eventType: "orders.order.paid.v1",
      responseStatus: 204,
      isDelivered: true,
    });
  });

  it("signs with both secrets during a rotation", async () => {
    const { action, sent } = setup(targetOf({ secrets: [SECRET, OLD_SECRET] }));
    await action.handle(inputFor(), ctx);
    expect(sent[0]?.headers["webhook-signature"]?.split(" ")).toHaveLength(2);
    await expect(verifyWebhook(sent[0]?.headers ?? {}, BODY, [OLD_SECRET], AT)).resolves.toBe(true);
  });

  it("logs and refuses a failure status as retryable", async () => {
    const { action, deliveries } = setup(targetOf(), 500);
    const failure = await action.handle(inputFor(), ctx).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WebhookDeliveryFailedError);
    expect(failure).toMatchObject({ status: 500, retryable: true });
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: 500, isDelivered: false }),
    );
  });

  it("logs and refuses a receiver that does not answer, or answers with a redirect", async () => {
    const down = setup(targetOf(), new TypeError("fetch failed"));
    await expect(down.action.handle(inputFor(), ctx)).rejects.toMatchObject({ status: null });
    expect(down.deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: null, isDelivered: false }),
    );
    const moved = setup(targetOf(), 301);
    await expect(moved.action.handle(inputFor(), ctx)).rejects.toBeInstanceOf(
      WebhookDeliveryFailedError,
    );
  });

  it("skips a receiver removed or disabled since the job was queued", async () => {
    const { action, sent, deliveries } = setup(null);
    await action.handle(inputFor(), ctx);
    expect(sent).toEqual([]);
    expect(deliveries.record).not.toHaveBeenCalled();
  });

  it("posts nothing when the store cannot resolve a signing secret", async () => {
    const { action, sent } = setup(new TypeError("ACME_WEBHOOK_SECRET_MISSING has no value"));
    await expect(action.handle(inputFor(), ctx)).rejects.toThrow(
      "ACME_WEBHOOK_SECRET_MISSING has no value",
    );
    expect(sent).toEqual([]);
  });

  it("disables the receiver after a dead letter", async () => {
    const { action, endpoints } = setup(targetOf());
    await action.disableEndpoint(inputFor());
    expect(endpoints.disable).toHaveBeenCalledWith(targetOf().id, AT);
  });

  it("writes an s3 receiver's delivery as one signed object", async () => {
    const { action, deliveries, sent, objects } = setup(
      targetOf({ url: "s3://acme-siem/stackra?region=me-central-1" }),
    );
    await action.handle(inputFor(), ctx);
    expect(sent).toEqual([]);
    const object = objects.object(
      "acme-siem",
      "stackra/orders.order.paid.v1/2026/10/25/evt_1.json",
    );
    expect(object).toMatchObject({ region: "me-central-1", body: BODY });
    expect(object?.metadata).toMatchObject({ "webhook-id": "evt_1" });
    await expect(verifyWebhook(object?.metadata ?? {}, BODY, [SECRET], AT)).resolves.toBe(true);
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: null, isDelivered: true }),
    );
  });

  it("logs and refuses a refused object write, so the queue retries it", async () => {
    const { action, deliveries } = setup(
      targetOf({ url: "s3://acme-siem/stackra" }),
      204,
      new WebhookObjectSinkFake().failWith(new Error("AccessDenied")),
    );
    await expect(action.handle(inputFor(), ctx)).rejects.toBeInstanceOf(WebhookDeliveryFailedError);
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ responseStatus: null, isDelivered: false }),
    );
  });

  it("delivers to a host store's receiver by its own id", async () => {
    const partner = targetOf({ id: "ple_1", url: "https://partner.example/leads" });
    const { action, sent, deliveries } = setup(partner);
    await action.handle(inputFor("ple_1"), ctx);
    expect(sent[0]?.url).toBe("https://partner.example/leads");
    expect(deliveries.record).toHaveBeenCalledWith(
      expect.objectContaining({ endpointId: "ple_1" }),
    );
  });
});
