/**
 * Stackra file contract:
 * Purpose: `staleReleaseClaims`, the check that keeps the customer pages and the release runbook from stating release
 *          facts that go stale: a claim that a version is unreleased or is "the first", a "Status, <date>" stamp, a
 *          figure "as of" a date, and a link to the old `figentra/stackra` GitHub path (the repositories moved to
 *          stackra-inc on 2026-11-26). Those pages say how to read the current version from the registry instead.
 * Boundary: pure: text in, findings out. It knows phrases, not versions: a page may still name a version in a code
 *           sample or an ADR link. A claim that wraps onto the next line is still found, on the line it starts.
 * Runtime: node
 * Governing contract: ADR 0013 (decisions 1 and 5: one version, generated changelogs); ADR 0453 (decision 18);
 *                     STA-1575; STA-2847.
 */
import type { StaleReleaseClaim } from "#scripts/customer-pages/stale-release-claim";

/** The phrases refused on these pages, each with the reason a reader sees. */
const RULES: readonly { readonly pattern: RegExp; readonly reason: string }[] = [
  {
    pattern: /\bnot (?:been )?released yet\b|\bno stable release yet\b/i,
    reason: "claims a release has not happened; say how to read the current version instead",
  },
  {
    pattern: /\b\d+\.\d+\.\d+\b[^.]*\bis the first\b|\bfirst release\b[^.]*\b\d+\.\d+\.\d+\b/i,
    reason: "names the first release as the current state",
  },
  {
    pattern: /\bstatus,? \d{4}-\d{2}-\d{2}\b/i,
    reason: "a dated status stamp goes stale; state the fact without the date",
  },
  {
    pattern: /\bas of \d{4}-\d{2}-\d{2}\b/i,
    reason: "a dated snapshot goes stale; generate the figure or drop it",
  },
  {
    pattern: /github\.com\/figentra\/stackra(?:-template|-pro)?\b/,
    reason: "links the old GitHub path; the repositories are under github.com/stackra-inc",
  },
];

/**
 * Finds the stale release claims in one page's text.
 *
 * @param page - the page name reported with each finding.
 * @param text - the page text.
 * @returns the findings, in line order; empty when the page is clean.
 * @example
 * staleReleaseClaims("customers/install.mdx", "Version `0.1.0` is not released yet"); // one finding, line 1
 */
export function staleReleaseClaims(page: string, text: string): StaleReleaseClaim[] {
  const findings: StaleReleaseClaim[] = [];
  const lines = text.split("\n");
  for (const [index, current] of lines.entries()) {
    const joined = `${current} ${lines[index + 1] ?? ""}`;
    for (const rule of RULES) {
      const match = rule.pattern.exec(joined);
      if (match !== null && match.index < current.length)
        findings.push({ page, line: index + 1, reason: rule.reason });
    }
  }
  return findings;
}
