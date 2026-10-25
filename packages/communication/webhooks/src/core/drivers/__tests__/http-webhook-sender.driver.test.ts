/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpWebhookSenderDriver`: one `POST` of the exact body with the signed headers, no redirect
 *          followed, the endpoint's status answered whatever it is, and a network failure rejected.
 * Boundary: test only; `fetch` is stubbed, so no request leaves the process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224 (decision 3); ADR 0142.
 */
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebhookSender } from "#contracts/index";
import { HttpWebhookSenderDriver } from "#core/drivers/http-webhook-sender.driver";

const REQUEST = {
  url: "https://hooks.acme.example/in",
  headers: {
    "content-type": "application/json",
    "webhook-id": "evt_1",
    "webhook-timestamp": "1614265330",
    "webhook-signature": "v1,abc",
  },
  body: '{"type":"orders.order.paid.v1"}',
};

/** Answers `fetch` with `answer`, recording every call. */
function stubFetch(answer: Response | Error) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (answer instanceof Error) throw answer;
      return answer;
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(HttpWebhookSenderDriver, () => {
  it("is the http driver of WebhookSender", () => {
    expect(new HttpWebhookSenderDriver()).toBeInstanceOf(WebhookSender);
    expect(kindOf(HttpWebhookSenderDriver)?.options).toEqual({ port: WebhookSender });
  });

  it("posts the exact body with the signed headers and follows no redirect", async () => {
    const calls = stubFetch(new Response(null, { status: 204 }));
    await expect(new HttpWebhookSenderDriver().send(REQUEST)).resolves.toBe(204);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(REQUEST.url);
    expect(calls[0]?.init).toMatchObject({
      method: "POST",
      headers: REQUEST.headers,
      body: REQUEST.body,
      redirect: "manual",
    });
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
  });

  it("answers a failure status as it came", async () => {
    stubFetch(new Response("down", { status: 503 }));
    await expect(new HttpWebhookSenderDriver().send(REQUEST)).resolves.toBe(503);
  });

  it("rejects when the endpoint does not answer", async () => {
    stubFetch(new TypeError("fetch failed"));
    await expect(new HttpWebhookSenderDriver().send(REQUEST)).rejects.toThrow("fetch failed");
  });

  it("aborts with the job's signal", async () => {
    const calls = stubFetch(new Response(null, { status: 200 }));
    const job = new AbortController();
    await new HttpWebhookSenderDriver().send({ ...REQUEST, signal: job.signal });
    job.abort();
    expect(calls[0]?.init.signal?.aborted).toBe(true);
  });
});
