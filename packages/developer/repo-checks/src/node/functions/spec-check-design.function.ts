/**
 * Stackra file contract:
 * Purpose: `specCheckDesign(text, where, level)`, the design's sections: every `SPEC_DESIGN_SECTIONS` name is a
 *          heading of `level` (`##` in plan.md, `###` under a small spec's `## Design`) with something under it.
 * Boundary: pure; a section that does not apply says "none", which counts.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers, EARS criteria and the design); ADR 0120. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_DESIGN_SECTIONS } from "../constants/spec-design-sections.constant.ts";
import { specStrip } from "./spec-strip.function.ts";

/**
 * Problems of a design.
 *
 * @param text - the design text: plan.md, or a small spec's `## Design` section.
 * @param where - how to name it in a problem (`plan.md`, `spec.md ## Design`).
 * @param level - the heading marks of a section (`##` or `###`).
 * @example
 * specCheckDesign(plan, "plan.md", "##");
 */
export function specCheckDesign(text: string, where: string, level: "##" | "###"): string[] {
  const body = specStrip(text);
  const problems: string[] = [];
  for (const name of SPEC_DESIGN_SECTIONS) {
    const section = new RegExp(
      `^${level} ${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=^#{2,3} |(?![\\s\\S]))`,
      "m",
    ).exec(body);
    if (section === null)
      problems.push(`${where}: the design has no \`${level} ${name}\` section (ADR 0502)`);
    else if ((section[1] ?? "").trim() === "")
      problems.push(
        `${where}: \`${level} ${name}\` is empty (write "none" when it does not apply)`,
      );
  }
  return problems;
}
