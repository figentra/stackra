/**
 * Stackra file contract:
 * Purpose: unit tests of `secretOf`: the value of a set variable; a missing or empty one fails naming the variable
 *          and never a value.
 * Boundary: test only; the environment is a plain record.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173 (secrets by name), ADR 0482 (decision 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { secretOf } from "#node/functions/secret-of.function";

describe("secretOf", () => {
  it("returns the value of a set variable", () => {
    expect(secretOf({ EXPO_TOKEN: "canary-value" }, "EXPO_TOKEN")).toBe("canary-value");
  });

  it("fails naming a missing or empty variable", () => {
    const env = { EXPO_TOKEN: "", OTHER: "canary-value" };

    expect(() => secretOf(env, "EXPO_TOKEN")).toThrow(RunwayUnresolvedError);
    expect(() => secretOf(env, "SENTRY_AUTH_TOKEN")).toThrow(
      /^SENTRY_AUTH_TOKEN is not set in this job/,
    );
    expect(() => secretOf(env, "EXPO_TOKEN")).toThrow(/^EXPO_TOKEN is not set in this job/);
  });
});
