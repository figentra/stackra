/**
 * Stackra file contract:
 * Purpose: proves createMatcher registers a matcher with `expect` (sync, async and with arguments), honours `.not`,
 *          shows the failure message, returns the matcher named after it, and that augmenting `Matchers` of
 *          `@stackra/testing` types `expect(x).toY()`.
 * Boundary: registers matchers whose names exist only in this file, so no other suite sees a clash.
 * Runtime: node
 * Governing contract: ADR 0269 (decisions 2 and 3); ADR 0022 (test placement).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { createMatcher } from "#core/functions/create-matcher.function";

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Test-only: the number is even. */
    toBeEvenInThisSuite(): R;

    /** Test-only: the number lies in [min, max]. */
    toBeWithinInThisSuite(min: number, max: number): R;

    /** Test-only: the async source yields `value`. */
    toYieldInThisSuite(value: string): Promise<R>;
  }
}

const toBeEvenInThisSuite = createMatcher("toBeEvenInThisSuite", (n: number) => ({
  pass: n % 2 === 0,
  message: () => `expected ${n} to be even`,
}));

const toBeWithinInThisSuite = createMatcher(
  "toBeWithinInThisSuite",
  (n: number, min: number, max: number) => ({
    pass: n >= min && n <= max,
    message: () => `expected ${n} to lie within ${min} and ${max}`,
  }),
);

createMatcher("toYieldInThisSuite", async (source: () => Promise<string>, value: string) => {
  const actual = await source();
  return { pass: actual === value, message: () => `expected "${value}", got "${actual}"` };
});

// @covers sta-348:FR-006
describe(createMatcher, () => {
  it("registers the matcher, so expect(x) offers it and .not inverts it", () => {
    expect(4).toBeEvenInThisSuite();
    expect(3).not.toBeEvenInThisSuite();
  });

  it("shows the matcher's message when it fails", () => {
    expect(() => expect(3).toBeEvenInThisSuite()).toThrow("expected 3 to be even");
  });

  it("passes the matcher's arguments after the received value", () => {
    expect(5).toBeWithinInThisSuite(1, 10);
    expect(() => expect(11).toBeWithinInThisSuite(1, 10)).toThrow("within 1 and 10");
  });

  it("awaits an async matcher", async () => {
    await expect(async () => "ok").toYieldInThisSuite("ok");
    await expect(expect(async () => "no").toYieldInThisSuite("ok")).rejects.toThrow('got "no"');
  });

  it("returns the matcher, named after it", () => {
    expect(toBeEvenInThisSuite.name).toBe("toBeEvenInThisSuite");
    expect(toBeEvenInThisSuite(2)).toMatchObject({ pass: true });
  });

  it("keeps the matcher's parameter types", () => {
    expectTypeOf(toBeWithinInThisSuite).parameters.toEqualTypeOf<[number, number, number]>();
    // @ts-expect-error the augmentation types the arguments of expect(x).toY()
    expect(5).toBeWithinInThisSuite("1", 10);
  });
});
