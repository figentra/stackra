/**
 * Stackra file contract:
 * Purpose: unit tests of `correlationIdOf`: the edge's request id wins, then the `traceparent`'s trace id, then the
 *          runtime's trace id, then a fresh `req_` id; a header that is not a plain id (spaces, quotes, too long) and
 *          an all-zero or malformed trace id are skipped, never echoed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140 (decision 1: `correlationId`); W3C Trace Context.
 */
import { describe, expect, it } from "@stackra/testing";

import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import { correlationIdOf } from "#server/functions/correlation-id-of.function";

const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";
const TRACEPARENT = `00-${TRACE}-00f067aa0ba902b7-01`;

/** A request carrying `headers`. */
function request(headers: Record<string, string> = {}): Request {
  return new Request("https://api.example.test/orders", { headers });
}

describe(correlationIdOf, () => {
  it("takes the edge's request id first", () => {
    expect(
      correlationIdOf(
        request({ [EdgeHeader.RequestId]: "req-7f3a", traceparent: TRACEPARENT }),
        "encore-trace",
      ),
    ).toBe("req-7f3a");
  });

  it("takes the traceparent's trace id, then the runtime's trace id", () => {
    expect(correlationIdOf(request({ traceparent: TRACEPARENT }), "encore-trace")).toBe(TRACE);
    expect(correlationIdOf(request(), "encore-trace")).toBe("encore-trace");
  });

  it("mints a req_ id when the request names none", () => {
    const first = correlationIdOf(request());
    expect(first).toMatch(/^req_[0-9a-z]{26}$/);
    expect(correlationIdOf(request())).not.toBe(first);
  });

  it("never echoes a header that is not a plain id", () => {
    for (const unsafe of ['"><script>', "a b", "x".repeat(129)])
      expect(correlationIdOf(request({ [EdgeHeader.RequestId]: unsafe }), "t-1")).toBe("t-1");
    expect(correlationIdOf(request(), 'bad "trace"')).toMatch(/^req_/);
  });

  it("skips an all-zero or malformed traceparent", () => {
    expect(
      correlationIdOf(request({ traceparent: `00-${"0".repeat(32)}-00f067aa0ba902b7-01` }), "t-1"),
    ).toBe("t-1");
    expect(correlationIdOf(request({ traceparent: "00-xyz-01" }), "t-1")).toBe("t-1");
  });
});
