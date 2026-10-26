/**
 * Stackra file contract:
 * Purpose: `checkKit(kit, files, readText)`, the kit check: the required files (the kit's `check.requiredFiles`, its
 *          theme and symbol), at least one logo SVG under `logos/` or `marks/` and one starting with each of the kit's
 *          `check.requiredMarks`, no live `<text>` in any logo SVG or the symbol, a usable symbol, and a `versions.json`,
 *          when present, whose versions have unique ids and known statuses, a retired one its earlier name, and the
 *          default one no `dir` (it lives at the kit root).
 * Boundary: pure: it reads files only through `readText`. It answers problems, one line each, and never throws for a
 *           kit's content. Which marks a kit must carry (an endorsement) is the kit owner's data in `kit.json`, never
 *           a rule here.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 4 to 6); ADR 0340 decision 10; ported from figentra/os
 *                     `tools/brand-kit/kit.mjs` (ORIGIN.md).
 */
import { Enum } from "@stackra/contracts";

import { KitStatus } from "#contracts/enums/kit-status.enum";
import type { BrandKit } from "#contracts/types/brand-kit.type";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { symbolOf } from "#core/functions/symbol-of.function";

/** One entry of `versions.json` as read; every field is checked before use. */
type VersionEntry = {
  readonly id?: unknown;
  readonly status?: unknown;
  readonly dir?: unknown;
  readonly name?: { readonly en?: unknown };
};

/** True for an SVG under a `logos/` or `marks/` folder, versions and directions included. */
const isLogoFile = (path: string): boolean =>
  path.endsWith(".svg") && /(^|\/)(logos|marks)\//u.test(path);

/** The problems of `versions.json`. */
function versionProblems(text: string, has: (path: string) => boolean): string[] {
  let data: { readonly default?: unknown; readonly versions?: unknown };
  try {
    data = JSON.parse(text) as typeof data;
  } catch (error) {
    return [`versions.json does not parse: ${(error as Error).message}`];
  }
  const versions = Array.isArray(data.versions) ? (data.versions as VersionEntry[]) : [];
  if (versions.length === 0) return ["versions.json: no versions listed"];
  const statuses: readonly string[] = Enum.values(KitStatus);
  const problems: string[] = [];
  const ids = new Set<unknown>();
  for (const entry of versions) {
    const id = String(entry.id);
    if (typeof entry.id !== "string" || entry.id === "" || ids.has(entry.id))
      problems.push(`versions.json: missing or duplicate id "${id}"`);
    ids.add(entry.id);
    if (typeof entry.status !== "string" || !statuses.includes(entry.status))
      problems.push(`versions.json: ${id}: status must be one of ${statuses.join(", ")}`);
    if (entry.status === KitStatus.Retired && typeof entry.name?.en !== "string")
      problems.push(`versions.json: ${id}: a retired name needs name.en`);
    if (typeof entry.dir === "string" && !has(entry.dir.replace(/\/$/u, "")))
      problems.push(`versions.json: ${id}: ${entry.dir}/ missing`);
  }
  if (data.default !== undefined && !ids.has(data.default))
    problems.push(`versions.json: default "${String(data.default)}" is not listed`);
  const fallback = versions[0]?.id;
  const current = versions.find((entry) => entry.id === (data.default ?? fallback));
  if (current?.dir !== undefined)
    problems.push('versions.json: the default version lives at the kit root, so it takes no "dir"');
  return problems;
}

/**
 * The problems of `kit`, whose folder holds `files`.
 *
 * @param kit - the parsed kit.
 * @param files - every file in the kit folder, relative, with `/` separators.
 * @param readText - reads one of `files` as text.
 * @returns one line per problem; empty when the kit passes.
 * @example
 * checkKit(kit, ["kit.json", "README.md", "theme.json", "marks/symbol.svg"], (path) => readFileSync(join(dir, path), "utf8"));
 */
export function checkKit(
  kit: BrandKit,
  files: readonly string[],
  readText: (path: string) => string,
): string[] {
  const present = new Set(files);
  // a path is present as a file, or as a folder holding one
  const has = (path: string): boolean =>
    present.has(path) || files.some((file) => file.startsWith(`${path}/`));
  const problems: string[] = [];
  for (const path of new Set([...kit.check.requiredFiles, kit.theme, kit.symbol]))
    if (!has(path)) problems.push(`missing ${path}`);

  const logos = files.filter(isLogoFile);
  if (logos.length === 0) problems.push("no logo SVG under logos/ or marks/");
  for (const mark of kit.check.requiredMarks)
    if (!logos.some((path) => (path.split("/").at(-1) ?? "").startsWith(mark)))
      problems.push(`no ${mark}*.svg mark under logos/ or marks/`);
  for (const path of logos)
    if (/<text[\s>]/u.test(readText(path)))
      problems.push(`${path}: live <text> in a logo file (outline it)`);

  if (present.has(kit.symbol))
    try {
      symbolOf(readText(kit.symbol), kit.symbol);
    } catch (error) {
      if (!(error instanceof InvalidKitError)) throw error;
      problems.push(...error.problems.map((problem) => `${kit.symbol}: ${problem}`));
    }

  if (present.has("versions.json"))
    problems.push(...versionProblems(readText("versions.json"), has));
  return problems;
}
