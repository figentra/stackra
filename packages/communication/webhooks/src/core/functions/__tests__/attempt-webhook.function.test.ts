/**
 * Stackra file contract:
 * Purpose: unit tests of `attemptWebhook` and `webhookBody`: the body is `{ type, timestamp, data }`; a 2xx post is
 *          delivered and verifies with the secret; a non-2xx answer (a redirect included) or no answer is not, with the
 *          transport error as the cause; an `s3:` target gets one signed object keyed by the body's day, and a refused
 *          write is not delivered.
 * Boundary: test only; the sender is an in-test fake and the object sink the testing fake. Web Crypto runs for real.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0224 (decisions 2 and 3); ADR 0422 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { WebhookRequest, WebhookSender } from "#contracts/index";
import { attemptWebhook } from "#core/functions/attempt-webhook.function";
import { verifyWebhook } from "#core/functions/verify-webhook.function";
import { webhookBody } from "#core/functions/webhook-body.function";
import { WebhookObjectSinkFake } from "#testing/fakes/webhook-object-sink.fake";

const AT = new Date("2026-10-25T09:00:00Z");
const SECRET = "test-partner-signing-secret";
const BODY = webhookBody("registry.lead.submitted.v1", new Date("2026-10-24T23:59:00Z"), {
  perkId: "prk_1",
});

/** A sender that answers `answer` and keeps what it was sent. */
function senderOf(answer: number | Error) {
  const sent: WebhookRequest[] = [];
  const sender = {
    send: async (request: WebhookRequest) => {
      sent.push(request);
      if (answer instanceof Error) throw answer;
      return answer;
    },
  } as unknown as WebhookSender;
  return { sender, sent };
}

const requestTo = (url: string) => ({
  url,
  eventId: "evt_1",
  type: "registry.lead.submitted.v1",
  body: BODY,
  secrets: [SECRET],
  now: AT,
});

describe(webhookBody, () => {
  it("is the type, the occurrence time and the data", () => {
    expect(JSON.parse(BODY)).toEqual({
      type: "registry.lead.submitted.v1",
      timestamp: "2026-10-24T23:59:00.000Z",
      data: { perkId: "prk_1" },
    });
  });
});

describe(attemptWebhook, () => {
  it("posts a signed body and reports a 2xx as delivered", async () => {
    const { sender, sent } = senderOf(202);
    const outcome = await attemptWebhook(requestTo("https://partner.example/leads"), {
      sender,
      objects: new WebhookObjectSinkFake(),
    });
    expect(outcome).toEqual({ status: 202, isDelivered: true });
    expect(sent[0]).toMatchObject({ url: "https://partner.example/leads", body: BODY });
    expect(sent[0]?.headers).toMatchObject({
      "content-type": "application/json",
      "webhook-id": "evt_1",
    });
    await expect(verifyWebhook(sent[0]?.headers ?? {}, BODY, [SECRET], AT)).resolves.toBe(true);
  });

  it("reports a redirect, a failure status or no answer as not delivered", async () => {
    const objects = new WebhookObjectSinkFake();
    const url = "https://partner.example/leads";
    await expect(
      attemptWebhook(requestTo(url), { sender: senderOf(301).sender, objects }),
    ).resolves.toEqual({
      status: 301,
      isDelivered: false,
    });
    const down = new TypeError("fetch failed");
    await expect(
      attemptWebhook(requestTo(url), { sender: senderOf(down).sender, objects }),
    ).resolves.toEqual({
      status: null,
      isDelivered: false,
      cause: down,
    });
  });

  it("writes an s3 target as one signed object keyed by the body's day", async () => {
    const { sender, sent } = senderOf(204);
    const objects = new WebhookObjectSinkFake();
    const outcome = await attemptWebhook(requestTo("s3://partner-leads/in?region=me-central-1"), {
      sender,
      objects,
    });
    expect(outcome).toEqual({ status: null, isDelivered: true });
    expect(sent).toEqual([]);
    const object = objects.object(
      "partner-leads",
      "in/registry.lead.submitted.v1/2026/10/24/evt_1.json",
    );
    expect(object).toMatchObject({ region: "me-central-1", body: BODY });
    await expect(verifyWebhook(object?.metadata ?? {}, BODY, [SECRET], AT)).resolves.toBe(true);
  });

  it("reports a refused object write as not delivered", async () => {
    const denied = new Error("AccessDenied");
    const outcome = await attemptWebhook(requestTo("s3://partner-leads/in"), {
      sender: senderOf(204).sender,
      objects: new WebhookObjectSinkFake().failWith(denied),
    });
    expect(outcome).toEqual({ status: null, isDelivered: false, cause: denied });
  });
});
