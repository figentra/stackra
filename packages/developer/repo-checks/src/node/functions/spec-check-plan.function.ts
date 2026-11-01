/**
 * Stackra file contract:
 * Purpose: `specCheckPlan(plan, spec)`, the Planned rules for a plan.md against its spec: no open marker, the
 *          Constitution Check rows PASS or N/A with a reason, the three deploy-mode rows, every live FR validated.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specDefinedIds } from "./spec-defined-ids.function.ts";
import { specDefinedLines } from "./spec-defined-lines.function.ts";
import { specProperties } from "./spec-properties.function.ts";
import { specStrip } from "./spec-strip.function.ts";

/** The table rows of `text`: every `|` line but the first (the header) and the rules, each as its trimmed cells. */
const tableRows = (text: string | undefined): string[][] =>
  (text ?? "")
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*-/.test(l))
    .slice(1)
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim()),
    );

/**
 * Problems of plan.md for a spec at Planned or later.
 *
 * @param plan - the plan.md text.
 * @param spec - the spec.md text.
 * @example
 * specCheckPlan(plan, spec); // []
 */
export function specCheckPlan(plan: string, spec: string): string[] {
  const problems: string[] = [];
  const body = specStrip(plan);
  if (/\[NEEDS CLARIFICATION/i.test(body))
    problems.push("plan.md: a `[NEEDS CLARIFICATION` marker remains");
  const section = (name: string): string | undefined =>
    new RegExp(`^## ${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(body)?.[1];
  const constitution = section("Constitution Check");
  if (constitution === undefined)
    problems.push("plan.md: the `## Constitution Check` table is missing");
  for (const [law, result, note] of tableRows(constitution)) {
    if (!/^(PASS|N\/A)$/i.test(result ?? ""))
      problems.push(
        `plan.md: Constitution Check \`${law}\` is \`${result ?? ""}\`, not PASS or N/A`,
      );
    else if (/^N\/A$/i.test(result ?? "") && !note)
      problems.push(`plan.md: Constitution Check \`${law}\` is N/A without a reason`);
  }
  const modes = new Set(tableRows(section("Deploy modes")).map(([m]) => (m ?? "").toLowerCase()));
  for (const mode of ["saas", "on-prem", "air-gapped"])
    if (!modes.has(mode)) problems.push(`plan.md: Deploy modes has no \`${mode}\` row`);
  const validated = new Set([...specProperties(plan).values()].flat());
  const frLines = specDefinedLines(spec, "FR");
  for (const fr of specDefinedIds(spec, "FR").live)
    if (!validated.has(fr) && !/example-only/i.test(frLines.get(fr) ?? ""))
      problems.push(`plan.md: ${fr} is validated by no P-### (or mark it example-only in spec.md)`);
  return problems;
}
