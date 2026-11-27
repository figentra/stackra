/**
 * Stackra file contract:
 * Purpose: unit tests of `layoutFindings` over a temporary repository: the root `.gitmodules` is judged against
 *          package.json `stackra.layout.submodules`, so a private submodule left in a repository is a `layout` finding
 *          and removing it (or declaring a public one) clears it (STA-2918).
 * Boundary: test only; writes a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0526 (decision 4); ADR 0022 (test placement).
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { layoutFindings } from "#node/functions/layout-findings.function";

/** The submodule findings of a temporary repository with `gitmodules` and package.json `stackra.layout`. */
function submoduleFindings(
  gitmodules: string | undefined,
  layout: Record<string, unknown> = {},
): string[] {
  const root = mkdtempSync(join(tmpdir(), "layout-findings-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ stackra: { layout } }));
  if (gitmodules !== undefined) writeFileSync(join(root, ".gitmodules"), gitmodules);
  const files = ["package.json", ...(gitmodules === undefined ? [] : [".gitmodules"])];
  return layoutFindings({ root, files })
    .filter((finding) => /submodule/.test(finding.text))
    .map((finding) => `${finding.rule}: ${finding.text}`);
}

/** A private notes submodule, as core carried until STA-2918. */
const NOTES =
  '[submodule ".notes"]\n\tpath = .notes\n\turl = https://github.com/example/private-notes.git\n';

describe("layoutFindings submodules", () => {
  it("reports an undeclared submodule as a layout finding", () => {
    const findings = submoduleFindings(NOTES, { allow: { ".gitmodules": "x", ".notes": "y" } });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/^layout: \.gitmodules: submodule \.notes /);
  });

  it("passes a repository without submodules", () => {
    expect(submoduleFindings(undefined)).toEqual([]);
  });

  it("passes a declared public submodule", () => {
    const text = '[submodule "vendor"]\n\tpath = vendor\n\turl = https://example.com/vendor.git\n';
    expect(submoduleFindings(text, { submodules: { vendor: "a public upstream" } })).toEqual([]);
  });
});
