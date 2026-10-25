/**
 * Stackra file contract:
 * Purpose: unit tests of `redact`: built-in and extra field names in any casing, `@Classified` fields of a shape
 *          instance, secret shapes inside strings, errors with cause and code, dates, bigints, cycles and depth, and
 *          that the input is never mutated.
 * Boundary: test only; every secret below is a made-up canary.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0147 (decision 1);
 *                     ADR 0134 (classification).
 */
import { DataClassification } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Classified, Schema } from "@stackra/validation";

import { redact } from "#core/functions/redact.function";

const MASK = "[redacted]";

class MemberView extends Schema {
  @Classified(DataClassification.Pseudonymous)
  memberId = "usr_01J0000000000000000000000";

  points = 120;
}

describe("redact", () => {
  it("masks built-in credential and personal-data names in any casing and nesting", () => {
    expect(
      redact({
        password: "canary-1",
        user: { Email: "a@b.example", api_key: "canary-2", "X-Api-Key": "canary-3" },
        accessToken: "canary-4",
        stripeApiKey: "canary-5",
        orderId: "ord_1",
      }),
    ).toEqual({
      password: MASK,
      user: { Email: MASK, api_key: MASK, "X-Api-Key": MASK },
      accessToken: MASK,
      stripeApiKey: MASK,
      orderId: "ord_1",
    });
  });

  it("masks a host's extra fields, normalised", () => {
    expect(
      redact(
        { customerId: "c", customer_id: "c", stripeCustomerId: "c", paymentId: "p", tally: 1 },
        ["customerId", "payment-id"],
      ),
    ).toEqual({
      customerId: MASK,
      customer_id: MASK,
      stripeCustomerId: MASK,
      paymentId: MASK,
      tally: 1,
    });
  });

  it("ignores an extra field that normalises to nothing", () => {
    expect(redact({ a: 1 }, ["--"])).toEqual({ a: 1 });
  });

  it("masks @Classified fields of a shape instance", () => {
    expect(redact({ member: new MemberView() })).toEqual({
      member: { memberId: MASK, points: 120 },
    });
  });

  it("masks secret shapes inside any string", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl";
    // Fake keys assembled at run time, so the repository's secret scan does not flag the fixture.
    const stripeKey = ["sk", "live", "ABCDEFGH12345678"].join("_");
    const awsKey = ["AKIA", "ABCDEFGHIJKLMNOP"].join("");
    const out = redact({
      header: "Bearer abc.def-ghi",
      note: `token ${jwt} in text`,
      key: stripeKey,
      github: "ghp_ABCDEFGHIJKLMNOPQRSTUVWX",
      slack: "xoxb-1234567890-abc",
      aws: awsKey,
      url: "https://user:canary-6@db.example/app",
    });
    expect(out).toEqual({
      header: MASK,
      note: `token ${MASK} in text`,
      key: MASK,
      github: MASK,
      slack: MASK,
      aws: MASK,
      url: `https://${MASK}@db.example/app`,
    });
  });

  it("turns an error into its name, message, stack, cause and own fields", () => {
    const cause = new Error("db down");
    const error = Object.assign(new TypeError("bad Bearer canary-7", { cause }), { code: "E_BAD" });
    const out = redact({ cause: error }) as { cause: Record<string, unknown> };
    expect(out.cause).toMatchObject({
      name: "TypeError",
      message: `bad ${MASK}`,
      code: "E_BAD",
      cause: { name: "Error", message: "db down" },
    });
    expect(typeof out.cause["stack"]).toBe("string");
    expect(JSON.stringify(out)).not.toContain("canary-7");
  });

  it("makes dates, invalid dates and bigints JSON-safe", () => {
    expect(
      redact({ at: new Date("2026-10-24T09:00:00Z"), never: new Date(Number.NaN), big: 10n }),
    ).toEqual({ at: "2026-10-24T09:00:00.000Z", never: null, big: "10" });
  });

  it("marks a cycle, logs a shared object twice and stops at depth eight", () => {
    const shared = { n: 1 };
    const cyclic: Record<string, unknown> = { shared, again: shared };
    cyclic["self"] = cyclic;
    expect(redact(cyclic)).toEqual({ shared: { n: 1 }, again: { n: 1 }, self: "[circular]" });

    let deep: Record<string, unknown> = { leaf: true };
    for (let level = 0; level < 10; level++) deep = { next: deep };
    expect(JSON.stringify(redact(deep))).toContain("[truncated]");
  });

  it("keeps primitives and never mutates its input", () => {
    const input = { password: "canary-8", list: [1, "two", false, null] };
    const out = redact(input);
    expect(input.password).toBe("canary-8");
    expect(out).toEqual({ password: MASK, list: [1, "two", false, null] });
    expect(redact(42)).toBe(42);
    expect(redact(undefined)).toBeUndefined();
  });
});
