/**
 * Stackra file contract:
 * Purpose: unit tests of `timeout`: a request with no response in time is aborted and refused with
 *          `RequestTimedOutError`, the caller's abort stays the platform's abort error, the timer stops once headers
 *          arrive (a stream is not cut), and a duration of zero is refused.
 * Boundary: test only; real timers with durations of a few milliseconds.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140.
 */
import { Duration } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RequestTimedOutError } from "#core/errors/request-timed-out.error";
import { createTransport } from "#core/functions/create-transport.function";
import { timeout } from "#core/functions/timeout.function";
import type { Transport } from "#core/types/transport.type";

/** A fetch that never answers and rejects, as the platform does, when its signal is or becomes aborted. */
const hanging: Transport = (request) =>
  new Promise((_, reject) => {
    const abort = (): void => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (request.signal.aborted) abort();
    else request.signal.addEventListener("abort", abort);
  });

describe("timeout", () => {
  it("refuses with RequestTimedOutError when no response arrives in time", async () => {
    const send = createTransport({ middleware: [timeout(Duration.seconds(0.01))], fetch: hanging });
    const error: unknown = await send(new Request("https://api.test/slow")).catch(
      (caughtError) => caughtError,
    );
    expect(isRefusal(error, RequestTimedOutError)).toBe(true);
    expect((error as RequestTimedOutError).timeout).toBe(Duration.seconds(0.01));
    expect((error as RequestTimedOutError).cause).toBeInstanceOf(DOMException);
  });

  it("passes the caller's abort through as the platform's abort error", async () => {
    const send = createTransport({ middleware: [timeout(Duration.seconds(10))], fetch: hanging });
    const controller = new AbortController();
    const sent = send(new Request("https://api.test/slow", { signal: controller.signal }));
    controller.abort();
    const error: unknown = await sent.catch((caughtError) => caughtError);
    expect(isRefusal(error)).toBe(false);
    expect((error as Error).name).toBe("AbortError");
  });

  it("aborts at once when the caller's signal is already aborted", async () => {
    const send = createTransport({ middleware: [timeout(Duration.seconds(10))], fetch: hanging });
    let aborted = false;
    await send(new Request("https://api.test/slow", { signal: AbortSignal.abort() })).catch(() => {
      aborted = true;
    });
    expect(aborted).toBe(true);
  });

  it("stops timing once the response has arrived, so a stream keeps flowing", async () => {
    let signal: AbortSignal | undefined;
    const send = createTransport({
      middleware: [timeout(Duration.seconds(0.01))],
      fetch: async (request) => {
        signal = request.signal;
        return new Response("streaming");
      },
    });
    await send(new Request("https://api.test/stream"));
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(signal?.aborted).toBe(false);
  });

  it("refuses a duration of zero", () => {
    expect(() => timeout(Duration.seconds(0))).toThrow(RangeError);
  });
});
