/**
 * Stackra file contract:
 * Purpose: `specCheckClarified(text, prefix)`, the problems that stop a spec from being planned: clarifications not
 *          complete, no issue key on its `**Linear**` line, an open marker, an unanswered Impact line.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_IMPACT_FIELDS } from "../constants/spec-impact-fields.constant.ts";

/**
 * Problems that stop the spec from being planned; empty means it may be.
 *
 * @param text - the spec.md text.
 * @param prefix - the issue prefix of the spec's folder (`sta`); its `**Linear**` key must use it.
 * @example
 * specCheckClarified(text, "os"); // ["`**Linear**` has no OS-n key"]
 */
export function specCheckClarified(text: string, prefix: string): string[] {
  const body = text.replaceAll(/<!--[\s\S]*?-->/g, "");
  const key = prefix.toUpperCase();
  const problems: string[] = [];
  if (!/^\*\*Clarifications status\*\*:\s*complete\s*$/im.test(body))
    problems.push("`**Clarifications status**` is not `complete` (run /speckit.clarify)");
  if (!new RegExp(`^\\*\\*Linear\\*\\*:\\s*${key}-\\d+\\b`, "m").test(body))
    problems.push(`\`**Linear**\` has no ${key}-n key`);
  if (/\[NEEDS CLARIFICATION/i.test(body)) problems.push("a `[NEEDS CLARIFICATION` marker remains");

  const impact = /^## Impact\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(body)?.[1];
  if (impact === undefined) {
    problems.push("the `## Impact` section is missing");
  } else {
    for (const field of SPEC_IMPACT_FIELDS) {
      const value = new RegExp(`^- \\*\\*${field}\\*\\*:[ \\t]*(.*)$`, "m").exec(impact)?.[1];
      if (value === undefined) problems.push(`Impact: \`${field}\` is missing`);
      else if (value.trim() === "" || /^\[.*\]$/.test(value.trim()))
        problems.push(`Impact: \`${field}\` is unanswered`);
    }
  }
  return problems;
}
