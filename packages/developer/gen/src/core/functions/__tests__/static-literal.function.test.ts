/**
 * Stackra file contract:
 * Purpose: unit tests of `staticLiteral`: objects, arrays, strings, numbers and references read as data, comments and
 *          trailing commas skipped, the end offset after the literal, and a spread, call or shorthand refused.
 * Boundary: test only; pure input and output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { staticLiteral } from "#core/functions/static-literal.function";

describe("staticLiteral", () => {
  it("reads a defineApp argument as data", () => {
    const text = [
      "{",
      "  // the identity",
      "  targets: [Target.Ios, Target.Android],",
      '  name: "Acme",',
      "  ios: { bundleId: 'com.acme.app', supportsTablet: true },",
      '  expo: { "orientation": `default`, splash: { width: 96, ratio: -1.5 }, extra: null, },',
      "});",
    ].join("\n");
    const { value, end } = staticLiteral(text);
    expect(value).toEqual({
      targets: ["Target.Ios", "Target.Android"],
      name: "Acme",
      ios: { bundleId: "com.acme.app", supportsTablet: true },
      expo: { orientation: "default", splash: { width: 96, ratio: -1.5 }, extra: null },
    });
    expect(text.slice(end)).toBe(");");
  });

  it("refuses what is not static data", () => {
    expect(() => staticLiteral("{ ...base }")).toThrow(/spread/);
    expect(() => staticLiteral("{ name: read() }")).toThrow(/call of read/);
    expect(() => staticLiteral("{ name }")).toThrow(/shorthand/);
    expect(() => staticLiteral("{ name: `a${b}` }")).toThrow(/template/);
  });
});
