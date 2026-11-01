/**
 * Stackra file contract:
 * Purpose: unit tests of `checkIgnoredGoldens`: an ignored file under `__golden__` is a finding naming the path; an
 *          ignored file elsewhere and a committed golden are not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-1807; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkIgnoredGoldens } from "#node/functions/check-ignored-goldens.function";

describe("checkIgnoredGoldens", () => {
  it("reports an ignored golden file and tells the author to re-include it", () => {
    const ignored = "packages/developer/gen/__golden__/a/expected/.stackra/x.ts";
    const findings = checkIgnoredGoldens(
      [ignored, "packages/developer/gen/__golden__/a/y.ts"],
      (p) => p === ignored,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toContain(`${ignored}: git ignores this golden file`);
    expect(findings[0]).toContain(".gitignore re-include");
  });

  it("leaves an ignored file outside __golden__ and a committed golden alone", () => {
    expect(
      checkIgnoredGoldens(["a/.stackra/x.ts", "a/__golden__/y.ts"], (p) => p.includes(".stackra")),
    ).toEqual([]);
  });
});
