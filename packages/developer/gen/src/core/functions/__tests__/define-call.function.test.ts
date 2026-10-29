/**
 * Stackra file contract:
 * Purpose: unit tests of `defineCall`: the `export default define*` call read with its name, line and static
 *          argument, a call quoted in a comment ignored, and a non-static argument returned as an Error.
 * Boundary: test only; pure input and output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { defineCall } from "#core/functions/define-call.function";

describe("defineCall", () => {
  it("reads the exported call and skips one quoted in a comment", () => {
    const text = [
      'import { defineApp, Target } from "@stackra/contracts";',
      "// `export default defineApp({ targets: [Target.Web], … })` once it ships.",
      'export default defineApp({ targets: [Target.Ios], name: "Acme" });',
      "",
    ].join("\n");
    expect(defineCall(text)).toEqual({
      name: "defineApp",
      line: 3,
      argument: { targets: ["Target.Ios"], name: "Acme" },
    });
  });

  it("returns nothing without a call and an Error for a non-static argument", () => {
    expect(defineCall("// definePackage({})\nexport default {};\n")).toBeUndefined();
    expect(defineCall("export default definePackage({ ...base });\n")?.argument).toBeInstanceOf(
      Error,
    );
  });
});
