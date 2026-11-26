/**
 * Stackra file contract:
 * Purpose: unit tests of `freeAndProFindings`: a page that names only published free packages and exactly the Pro
 *          list passes; an unknown free package, a Pro package off the list and a Pro package left out are each named.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0461 (decision 2); STA-2865.
 */
import { describe, expect, it } from "@stackra/testing";

import { freeAndProFindings } from "../free-and-pro-findings";

const FREE = new Set(["@stackra/ai", "@stackra/builder"]);
const PRO = ["@stackra-pro/ai-studio", "@stackra-pro/builder-studio"];

describe("freeAndProFindings", () => {
  it("passes a page that names real free packages and the whole Pro list", () => {
    const page =
      "| `@stackra/ai` | `@stackra-pro/ai-studio` |\n| `@stackra/builder/react` | `@stackra-pro/builder-studio` |";
    expect(freeAndProFindings(page, FREE, PRO)).toEqual([]);
  });

  it("names a free package the repository does not publish", () => {
    const page =
      "`@stackra/ai` `@stackra/old-name`\n`@stackra-pro/ai-studio` `@stackra-pro/builder-studio`";
    expect(freeAndProFindings(page, FREE, PRO)).toEqual([
      { line: 1, reason: "names @stackra/old-name, which is not a published @stackra package" },
    ]);
  });

  it("names a Pro package that is not on the list", () => {
    const page = "`@stackra-pro/ai-studio` `@stackra-pro/builder-studio`\n\n`@stackra-pro/ui`";
    expect(freeAndProFindings(page, FREE, PRO)).toEqual([
      { line: 3, reason: "names @stackra-pro/ui, which is not on the Pro list of ADR 0461" },
    ]);
  });

  it("names each Pro package the page leaves out, after the line findings", () => {
    expect(freeAndProFindings("`@stackra/gone`\n`@stackra-pro/ai-studio`", FREE, PRO)).toEqual([
      { line: 1, reason: "names @stackra/gone, which is not a published @stackra package" },
      {
        line: undefined,
        reason: "leaves out @stackra-pro/builder-studio, which ADR 0461 puts on sale",
      },
    ]);
  });
});
