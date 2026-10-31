/**
 * Stackra file contract:
 * Purpose: `specCheckCriteria(text)`, the acceptance criteria of a tiered spec: a `## Acceptance criteria` section of
 *          `- **AC-###**:` lines, each in an EARS form: `WHEN <event> THE <system> SHALL <response>`, `IF <condition>
 *          THEN THE <system> SHALL <response>`, `WHILE <state> THE <system> SHALL <response>`, `WHERE <feature> THE
 *          <system> SHALL <response>`, or `THE <system> SHALL <response>`.
 * Boundary: pure; the keywords are upper-case, so a criterion reads the same in every spec.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers, EARS criteria and the design); ADR 0120. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { specDefinedLines } from "./spec-defined-lines.function.ts";
import { specStrip } from "./spec-strip.function.ts";

/** The EARS forms, each anchored at the start of the criterion. */
const EARS =
  /^(?:WHEN \S.*? THE \S.*? SHALL \S|IF \S.*? THEN THE \S.*? SHALL \S|WHILE \S.*? THE \S.*? SHALL \S|WHERE \S.*? THE \S.*? SHALL \S|THE \S.*? SHALL \S)/;

/**
 * Problems of a spec's acceptance criteria.
 *
 * @param text - the spec.md text.
 * @example
 * specCheckCriteria("## Acceptance criteria\n\n- **AC-001**: WHEN a pass is issued THE wallet SHALL show it\n"); // []
 */
export function specCheckCriteria(text: string): string[] {
  if (!/^## Acceptance criteria\b/m.test(specStrip(text)))
    return [
      "spec.md: a tiered spec has an `## Acceptance criteria` section of EARS criteria (ADR 0502)",
    ];
  const lines = specDefinedLines(text, "AC");
  if (lines.size === 0)
    return ["spec.md: `## Acceptance criteria` has no `- **AC-###**:` criterion (ADR 0502)"];
  const problems: string[] = [];
  for (const [id, rest] of lines) {
    const criterion = rest.replace(/^\s*:\s*/, "").trim();
    if (!EARS.test(criterion))
      problems.push(
        `spec.md: ${id} is not EARS ("WHEN <event> THE <system> SHALL <response>", or the IF ... THEN, WHILE, WHERE or THE ... SHALL form)`,
      );
  }
  return problems;
}
