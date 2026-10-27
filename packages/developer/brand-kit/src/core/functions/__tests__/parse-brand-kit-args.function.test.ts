/**
 * Stackra file contract:
 * Purpose: unit tests of `parseBrandKitArgs`: flags map to run options, absent flags are left out, and unknown flags
 *          or output codes throw.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { describe, expect, it } from "@stackra/testing";

import { parseBrandKitArgs } from "#core/functions/parse-brand-kit-args.function";

describe("parseBrandKitArgs", () => {
  it("maps the flags", () => {
    expect(
      parseBrandKitArgs([
        "--check",
        "--outputs",
        "tokens, heroui_css",
        "--parent-kit-dir",
        "../os/kit",
      ]),
    ).toEqual({ check: true, outputs: ["tokens", "heroui_css"], parentKitDir: "../os/kit" });
    expect(parseBrandKitArgs([])).toEqual({});
  });

  it("refuses unknown flags and outputs", () => {
    expect(() => parseBrandKitArgs(["--nope"])).toThrow();
    expect(() => parseBrandKitArgs(["--outputs", "logo"])).toThrow(TypeError);
  });
});
