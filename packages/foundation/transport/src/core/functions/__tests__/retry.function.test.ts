/**
 * Stackra file contract:
 * Purpose: unit tests of `retry`: what is safe to repeat (idempotent methods, or a request with an Idempotency-Key)
 *          is retried after a network failure, a timeout and a 429 or 503, each attempt with the full body; a POST
 *          without a key is sent once; `retryable: false`, a long `Retry-After`, a non-retryable status,
 *          `RetryOn.Network` and the attempt limit stop it; a caller's abort ends a wait; bad attempts are refused.
 * Boundary: test only; a scripted fetch, and a `base` of zero. The default waits (200 ms doubling to 5 s, as before
 *           stackra-223) are pinned in the contracts `backoffDelay` test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140; ADR 0138; ADR 0217.
 */
import { Duration, RetryOn } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RequestTimedOutError } from "#core/errors/request-timed-out.error";
import { createTransport } from "#core/functions/create-transport.function";
import { retry } from "#core/functions/retry.function";
import type { RetryOptions } from "#core/types/retry-options.type";

/** One scripted answer: a response to return, or an error to throw. */
type Outcome = (() => Response) | Error;

/** A transport through `retry(options)` over a fetch that answers with `outcomes` in turn. */
function scripted(options: Partial<RetryOptions>, ...outcomes: Outcome[]) {
  const bodies: string[] = [];
  const send = createTransport({
    middleware: [retry({ attempts: 3, base: Duration.seconds(0), ...options })],
    fetch: async (request) => {
      if (request.signal.aborted) throw new DOMException("aborted", "AbortError");
      bodies.push(await request.text());
      const outcome = outcomes[Math.min(bodies.length, outcomes.length) - 1];
      if (outcome === undefined) throw new Error("no outcome scripted");
      if (outcome instanceof Error) throw outcome;
      return outcome();
    },
  });
  return { send, bodies };
}

const ok = (): Response => new Response("ok");
/** A response factory with no body, `status` and optional headers. */
const answer =
  (status: number, headers: Record<string, string> = {}) =>
  (): Response =>
    new Response(null, { status, headers });
const unavailable = answer(503);
/** A 503 whose envelope says the call must not be repeated. */
const maintenance = (): Response =>
  Response.json(
    { code: "maintenance", category: "unavailable", retryable: false },
    { status: 503 },
  );
const networkDown = (): TypeError => new TypeError("fetch failed");
const url = "https://api.test/orders";

describe("retry", () => {
  it("retries a GET after a network failure", async () => {
    const { send, bodies } = scripted({}, networkDown(), ok);
    expect((await send(new Request(url))).status).toBe(200);
    expect(bodies).toHaveLength(2);
  });

  it("retries a GET after a timeout", async () => {
    const { send, bodies } = scripted(
      {},
      RequestTimedOutError.create({ timeout: Duration.seconds(1) }),
      ok,
    );
    expect((await send(new Request(url))).status).toBe(200);
    expect(bodies).toHaveLength(2);
  });

  it("never repeats a POST without an Idempotency-Key", async () => {
    const { send, bodies } = scripted({}, networkDown(), ok);
    await expect(send(new Request(url, { method: "POST", body: "x" }))).rejects.toThrow(TypeError);
    expect(bodies).toEqual(["x"]);
  });

  it("repeats a POST with an Idempotency-Key, with the whole body each time", async () => {
    const { send, bodies } = scripted({}, networkDown(), unavailable, ok);
    const request = new Request(url, {
      method: "POST",
      body: "payload",
      headers: { "Idempotency-Key": "k1" },
    });
    expect((await send(request)).status).toBe(200);
    expect(bodies).toEqual(["payload", "payload", "payload"]);
  });

  it("retries a 429 or 503 and returns the last answer when attempts run out", async () => {
    const { send, bodies } = scripted({}, answer(429), unavailable, unavailable);
    expect((await send(new Request(url))).status).toBe(503);
    expect(bodies).toHaveLength(3);
  });

  it("does not retry a status whose kind is not retryable", async () => {
    const { send, bodies } = scripted({}, answer(404), ok);
    expect((await send(new Request(url))).status).toBe(404);
    expect(bodies).toHaveLength(1);
  });

  it("does not retry a refusal whose envelope says retryable: false", async () => {
    const { send, bodies } = scripted({}, maintenance, ok);
    const response = await send(new Request(url));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "maintenance" });
    expect(bodies).toHaveLength(1);
  });

  it("waits for a short Retry-After and returns a long one without waiting", async () => {
    const short = scripted({}, answer(429, { "Retry-After": "0" }), ok);
    expect((await short.send(new Request(url))).status).toBe(200);

    const long = scripted(
      { maxWait: Duration.seconds(30) },
      answer(429, { "Retry-After": "120" }),
      ok,
    );
    expect((await long.send(new Request(url))).status).toBe(429);
    expect(long.bodies).toHaveLength(1);
  });

  it("reads a Retry-After given as an HTTP date", async () => {
    const { send, bodies } = scripted(
      {},
      answer(503, { "Retry-After": new Date(0).toUTCString() }),
      ok,
    );
    expect((await send(new Request(url))).status).toBe(200);
    expect(bodies).toHaveLength(2);
  });

  it("retries only a network failure with RetryOn.Network (was refused: false)", async () => {
    const plain = scripted({ retryOn: RetryOn.Network }, unavailable, ok);
    expect((await plain.send(new Request(url))).status).toBe(503);
    expect(plain.bodies).toHaveLength(1);

    const dropped = scripted({ retryOn: RetryOn.Network }, networkDown(), ok);
    expect((await dropped.send(new Request(url))).status).toBe(200);
    expect(dropped.bodies).toHaveLength(2);
  });

  it("does not retry an error that is not a network failure", async () => {
    const { send, bodies } = scripted({}, new Error("bug"), ok);
    await expect(send(new Request(url))).rejects.toThrow("bug");
    expect(bodies).toHaveLength(1);
  });

  it("ends a wait when the caller aborts and fails with the abort", async () => {
    const { send, bodies } = scripted({ base: Duration.seconds(10) }, networkDown(), ok);
    const controller = new AbortController();
    const sent = send(new Request(url, { signal: controller.signal }));
    setTimeout(() => controller.abort(), 5);
    const started = Date.now();
    const error: unknown = await sent.catch((caughtError) => caughtError);
    expect((error as Error).name).toBe("AbortError");
    expect(Date.now() - started).toBeLessThan(5000);
    expect(bodies).toHaveLength(1);
  });

  it.each([0, 1.5, Number.NaN])("refuses %d attempts", (attempts) => {
    expect(() => retry({ attempts })).toThrow(RangeError);
  });
});
