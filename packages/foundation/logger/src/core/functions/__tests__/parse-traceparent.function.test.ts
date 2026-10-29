/**
 * Stackra file contract:
 * Purpose: unit tests of `parseTraceparent` and `formatTraceparent`: a valid header round-trips, the sampled flag is
 *          read from the flags byte, a later version's extra fields are tolerated, and malformed headers (wrong
 *          length, upper case, all-zero ids, version `ff`, extra fields on version `00`) give `undefined`.
 * Boundary: test only. The ids are the W3C specification's example.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; W3C Trace Context.
 */
import { describe, expect, it } from "@stackra/testing";

import { formatTraceparent } from "#core/functions/format-traceparent.function";
import { parseTraceparent } from "#core/functions/parse-traceparent.function";

const TRACE = "4bf92f3577b34da6a3ce929d0e0e4736";
const SPAN = "00f067aa0ba902b7";

describe("parseTraceparent", () => {
  it("round-trips a valid header", () => {
    const header = `00-${TRACE}-${SPAN}-01`;
    expect(parseTraceparent(header)).toEqual({ traceId: TRACE, spanId: SPAN, sampled: true });
    const parsed = parseTraceparent(header);
    expect(parsed === undefined ? undefined : formatTraceparent(parsed)).toBe(header);
    expect(formatTraceparent({ traceId: TRACE, spanId: SPAN, sampled: false })).toBe(
      `00-${TRACE}-${SPAN}-00`,
    );
  });

  it("reads the sampled bit and tolerates a later version's fields", () => {
    expect(parseTraceparent(`00-${TRACE}-${SPAN}-02`)?.sampled).toBe(false);
    expect(parseTraceparent(`01-${TRACE}-${SPAN}-03-extra`)?.sampled).toBe(true);
  });

  it("refuses malformed headers", () => {
    for (const header of [
      undefined,
      "",
      "garbage",
      `00-${TRACE.toUpperCase()}-${SPAN}-01`,
      `00-${"0".repeat(32)}-${SPAN}-01`,
      `00-${TRACE}-${"0".repeat(16)}-01`,
      `ff-${TRACE}-${SPAN}-01`,
      `00-${TRACE}-${SPAN}-01-extra`,
      `00-${TRACE.slice(1)}-${SPAN}-01`,
    ])
      expect(parseTraceparent(header)).toBeUndefined();
  });
});
