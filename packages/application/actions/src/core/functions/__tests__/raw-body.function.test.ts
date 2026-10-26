/**
 * Stackra file contract:
 * Purpose: unit tests of `rawBody` and `isRawBody`: the marker, the optional filename, and that an ordinary output with
 *          `contentType` and `body` fields is not a raw body.
 * Boundary: test only; pure functions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (Note STA-1248).
 */
import { describe, expect, it } from "@stackra/testing";

import { isRawBody } from "#core/functions/is-raw-body.function";
import { rawBody } from "#core/functions/raw-body.function";

describe(rawBody, () => {
  it("marks the body and keeps the filename only when given", () => {
    expect(rawBody("text/calendar", "BEGIN:VCALENDAR")).toEqual({
      "~raw": true,
      contentType: "text/calendar",
      body: "BEGIN:VCALENDAR",
    });
    expect(rawBody("text/csv", "a,b", "orders.csv").filename).toBe("orders.csv");
    expect(Object.isFrozen(rawBody("text/plain", ""))).toBe(true);
  });
});

describe(isRawBody, () => {
  it("recognises the marker and nothing else", () => {
    expect(isRawBody(rawBody("text/plain", "x"))).toBe(true);
    expect(isRawBody({ contentType: "text/plain", body: "x" })).toBe(false);
    expect(isRawBody(null)).toBe(false);
    expect(isRawBody("x")).toBe(false);
  });
});
