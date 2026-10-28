/**
 * Stackra file contract:
 * Purpose: unit tests of `checkGitignore`: `.stackra/`, `.stackra/*`, `/.stackra` and the every-member double-star form
 *          pass; a missing file or a file without the line is one finding.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0295 (decision 5); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkGitignore } from "#node/functions/check-gitignore.function";

describe("checkGitignore", () => {
  it("accepts the ignore line in its usual spellings", () => {
    for (const line of [
      ".stackra/*",
      ".stackra/",
      "/.stackra",
      ".stackra",
      "**/.stackra/*",
      "**/.stackra/",
    ])
      expect(checkGitignore(`node_modules\n${line}\n!.stackra/app-manifest.json\n`)).toEqual([]);
  });

  it("reports a missing .gitignore or a missing line", () => {
    expect(checkGitignore(undefined)).toHaveLength(1);
    expect(checkGitignore("node_modules\n.stackra-old/\n")).toHaveLength(1);
  });
});
