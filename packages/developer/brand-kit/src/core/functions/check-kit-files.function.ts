/**
 * Stackra file contract:
 * Purpose: `checkKitFiles`, the kit file checklist: the README and version history, the seed record when `kit.json`
 *          asks for one, at least one logo, the parent's endorsement mark when the kit is endorsed, no live `<text>`
 *          in a logo or mark SVG, and every source the selected outputs need.
 * Boundary: pure; issues are sorted by path then code. The endorsement mark is named after the parent kit id
 *           (`<by|powered-by>-<parent>*.svg`), so a parent's marks plug in as files, never as code.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended); ADR 0231 (snake_case codes).
 */
import type { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { BrandCheckIssue } from "#contracts/types/brand-check-issue.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import { KIT_SOURCES } from "#core/constants/kit-sources.constant";
import { missingSources } from "#core/functions/missing-sources.function";
import { isLogoFile } from "#core/functions/is-logo-file.function";

/**
 * The checklist issues of `input` for `outputs`.
 *
 * @example
 * const issues = checkKitFiles(input, Enum.values(BrandOutput));
 */
export function checkKitFiles(input: KitInput, outputs: readonly BrandOutput[]): BrandCheckIssue[] {
  const issues: BrandCheckIssue[] = [];
  const has = (path: string) => input.files.includes(path);
  const required = [
    KIT_SOURCES.readme,
    KIT_SOURCES.versions,
    ...(input.kit.seed === true ? [KIT_SOURCES.seed] : []),
  ];
  for (const path of [...required, ...outputs.flatMap((output) => missingSources(input, output))])
    if (!has(path))
      issues.push({ code: "missing_file", path, message: "required by the kit file checklist" });

  const logos = input.files.filter(isLogoFile);
  if (logos.length === 0)
    issues.push({ code: "no_logo", path: "logos/", message: "no logo SVG under logos/ or marks/" });

  const { parent } = input.kit;
  if (parent?.endorsement) {
    const mark = `${parent.endorsement}-${parent.kit}`;
    if (!logos.some((path) => path.slice(path.lastIndexOf("/") + 1).startsWith(mark)))
      issues.push({
        code: "missing_endorsement_mark",
        path: "logos/",
        message: `endorsed by ${parent.kit}: no ${mark}*.svg under logos/ or marks/`,
      });
  }

  for (const path of logos) {
    const svg = new TextDecoder().decode(input.sources.get(path));
    if (/<text[\s>]/.test(svg))
      issues.push({
        code: "live_text",
        path,
        message: "live <text> in a logo file; outline the type",
      });
  }

  const seen = new Set<string>();
  return issues
    .filter(
      (issue) =>
        !seen.has(`${issue.code}\0${issue.path}`) && seen.add(`${issue.code}\0${issue.path}`),
    )
    .sort((a, b) => (a.path === b.path ? a.code.localeCompare(b.code) : a.path < b.path ? -1 : 1));
}
