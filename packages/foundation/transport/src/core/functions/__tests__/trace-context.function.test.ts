/**
 * Stackra file contract:
 * Purpose: unit tests of `traceContext`: it sends the tracer's current `traceparent`, read per request; it sends
 *          nothing outside a span; a `traceparent` already on the request wins.
 * Boundary: test only; the fetch is a stub and the tracer a fake whose current span the test sets.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 1).
 */
import { NoopTracerDriver } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { createTransport } from "#core/functions/create-transport.function";
import { traceContext } from "#core/functions/trace-context.function";

const PARENT = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

/** A tracer whose current span the test sets. */
class FixedTracer extends NoopTracerDriver {
  current: string | undefined;

  override traceparent(): string | undefined {
    return this.current;
  }
}

/** Sends one GET through `traceContext(tracer)` and returns the header that reached fetch. */
async function sent(tracer: FixedTracer, init?: RequestInit): Promise<string | null> {
  let seen: string | null = null;
  const send = createTransport({
    middleware: [traceContext(tracer)],
    fetch: async (request) => {
      seen = request.headers.get("traceparent");
      return new Response(null, { status: 204 });
    },
  });
  await send(new Request("https://api.test/orders", init));
  return seen;
}

describe("traceContext", () => {
  it("sends the current span's traceparent, read on each request", async () => {
    const tracer = new FixedTracer();
    expect(await sent(tracer)).toBeNull();
    tracer.current = PARENT;
    expect(await sent(tracer)).toBe(PARENT);
  });

  it("keeps a traceparent already on the request", async () => {
    const tracer = new FixedTracer();
    tracer.current = PARENT;
    const own = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00";
    expect(await sent(tracer, { headers: { traceparent: own } })).toBe(own);
  });
});
