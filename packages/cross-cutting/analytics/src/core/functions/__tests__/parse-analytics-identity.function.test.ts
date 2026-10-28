/**
 * Stackra file contract:
 * Purpose: unit tests of `parseAnalyticsIdentity`: JSON text or a parsed value becomes a frozen record with only the
 *          fields it holds; malformed JSON, a missing anonymous id, an oversized id or a wrong type reads as `null`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0298 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseAnalyticsIdentity } from "#core/functions/parse-analytics-identity.function";

describe(parseAnalyticsIdentity, () => {
  it("reads JSON text and parsed values, keeping only the fields present", () => {
    expect(parseAnalyticsIdentity('{"anonymousId":"anon_1"}')).toEqual({ anonymousId: "anon_1" });
    const full = parseAnalyticsIdentity({
      anonymousId: "anon_1",
      userId: "usr_1",
      groups: { scope: "scp_1" },
      extra: "dropped",
    });
    expect(full).toEqual({ anonymousId: "anon_1", userId: "usr_1", groups: { scope: "scp_1" } });
    expect(Object.isFrozen(full)).toBe(true);
  });

  it.each([
    ["malformed JSON", "{anonymousId"],
    ["no anonymous id", { userId: "usr_1" }],
    ["an empty anonymous id", { anonymousId: "" }],
    ["an oversized id", { anonymousId: "a".repeat(129) }],
    ["a numeric user id", { anonymousId: "anon_1", userId: 7 }],
    ["null", null],
  ])("reads %s as null", (_case, value) => {
    expect(parseAnalyticsIdentity(value)).toBeNull();
  });
});
