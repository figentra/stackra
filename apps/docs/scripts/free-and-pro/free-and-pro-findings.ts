/**
 * Stackra file contract:
 * Purpose: `freeAndProFindings`, the check of the "Free and Pro" customer page: every `@stackra/*` package it names is
 *          a published package of this repository, every `@stackra-pro/*` package it names is on the Pro list of
 *          ADR 0461, and the page names every package of that list. A renamed or removed package, or a Pro line that
 *          changes without the page, fails the docs test.
 * Boundary: pure: the page text, the published free names and the Pro list in, findings out.
 * Runtime: node
 * Governing contract: ADR 0461 (decisions 1 and 2); STA-2865.
 */
import type { FreeAndProFinding } from "#scripts/free-and-pro/free-and-pro-finding";
import { packageMentions } from "#scripts/free-and-pro/package-mentions";

/**
 * Checks the page against the published free packages and the Pro list.
 *
 * @param text - the page text.
 * @param freePackages - the names of the published `@stackra/*` packages.
 * @param proPackages - the `@stackra-pro/*` packages on sale.
 * @returns the findings: those on a line first, in line order, then the Pro packages the page leaves out.
 * @example
 * freeAndProFindings("`@stackra/nope`", new Set(["@stackra/ai"]), []);
 * // [{ line: 1, reason: "names @stackra/nope, which is not a published @stackra package" }]
 */
export function freeAndProFindings(
  text: string,
  freePackages: ReadonlySet<string>,
  proPackages: readonly string[],
): FreeAndProFinding[] {
  const mentions = packageMentions(text);
  const onLines = mentions.flatMap(({ name, line }): FreeAndProFinding[] => {
    if (name.startsWith("@stackra-pro/"))
      return proPackages.includes(name)
        ? []
        : [{ line, reason: `names ${name}, which is not on the Pro list of ADR 0461` }];
    return freePackages.has(name)
      ? []
      : [{ line, reason: `names ${name}, which is not a published @stackra package` }];
  });
  const named = new Set(mentions.map(({ name }) => name));
  const missing = proPackages
    .filter((name) => !named.has(name))
    .map((name) => ({
      line: undefined,
      reason: `leaves out ${name}, which ADR 0461 puts on sale`,
    }));
  return [...onLines, ...missing];
}
