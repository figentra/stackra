/**
 * Stackra file contract:
 * Purpose: unit tests of `checkKitFiles`: a complete kit has no issue; missing sources, a missing logo, a missing
 *          endorsement mark and live `<text>` in a logo each give their code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BrandOutput } from "#contracts/enums/brand-output.enum";
import { Endorsement } from "#contracts/enums/endorsement.enum";
import { checkKitFiles } from "#core/functions/check-kit-files.function";
import { ALL_SOURCES } from "#core/functions/__tests__/all-sources.fixture";
import { kitInput } from "#core/functions/__tests__/kit-input.fixture";

describe("checkKitFiles", () => {
  it("passes a complete kit", () => {
    expect(checkKitFiles(kitInput(), Enum.values(BrandOutput))).toEqual([]);
  });

  it("asks only for the sources the selected outputs read", () => {
    const input = kitInput([
      "README.md",
      "versions.json",
      "tokens/theme.json",
      "logos/favicon/favicon.svg",
    ]);
    expect(checkKitFiles(input, [BrandOutput.Tokens])).toEqual([]);
    expect(checkKitFiles(input, [BrandOutput.Splash]).map((issue) => issue.path)).toEqual([
      "logos/splash/splash-light.svg",
    ]);
  });

  it("reports a kit with no logo", () => {
    const codes = checkKitFiles(kitInput(["README.md", "versions.json"]), []).map(
      (issue) => issue.code,
    );
    expect(codes).toEqual(["no_logo"]);
  });

  it("wants the parent's endorsement mark, named after the parent kit", () => {
    const parent = { kit: "parent", version: "1.0.0", endorsement: Endorsement.PoweredBy };
    const base = kitInput();
    const endorsed = { ...base, kit: { ...base.kit, parent } };
    expect(checkKitFiles(endorsed, []).map((issue) => issue.code)).toEqual([
      "missing_endorsement_mark",
    ]);
    const marked = kitInput([...ALL_SOURCES, "logos/powered-by-parent-en.svg"]);
    expect(checkKitFiles({ ...marked, kit: { ...marked.kit, parent } }, [])).toEqual([]);
  });

  it("refuses live text in a logo", () => {
    const input = kitInput();
    const sources = new Map(input.sources);
    sources.set("logos/favicon/favicon.svg", new TextEncoder().encode("<svg><text>A</text></svg>"));
    expect(checkKitFiles({ ...input, sources }, [])).toEqual([
      { code: "live_text", path: "logos/favicon/favicon.svg", message: expect.any(String) },
    ]);
  });
});
