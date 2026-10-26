/**
 * Stackra file contract:
 * Purpose: `checkTestPlacement(paths)`, ADR 0022: every test file sits directly in `__tests__/` and is named `.test`, never
 *          `.spec`; no forbidden file (Storybook stories) exists. `.old/` is archived code.
 * Boundary: pure: paths only.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0126 (no Storybook).
 */
import { FORBIDDEN_FILES } from "#node/constants/forbidden-files.constant";
import { SPEC_PATTERN } from "#node/constants/spec-pattern.constant";
import { TEST_FILE_PATTERN } from "#node/constants/test-file-pattern.constant";

/**
 * The test-placement and forbidden-file findings for `paths`.
 *
 * @param paths - repository-relative paths.
 * @example
 * checkTestPlacement(["packages/x/src/a.test.ts"]); // one finding
 */
export function checkTestPlacement(paths: readonly string[]): string[] {
  const out: string[] = [];
  for (const p of paths) {
    if (p.startsWith(".old/")) continue;
    for (const forbidden of FORBIDDEN_FILES)
      if (forbidden.pattern.test(p)) out.push(`${p}: ${forbidden.hint}`);
    if (!TEST_FILE_PATTERN.test(p)) continue;
    const parts = p.split("/");
    if (parts.at(-2) !== "__tests__")
      out.push(`${p}: test files go in a __tests__/ folder (ADR 0022)`);
    if (SPEC_PATTERN.test(parts.at(-1) ?? ""))
      out.push(`${p}: name it <subject>.test.<ext>, not .spec (ADR 0022)`);
  }
  return out;
}
