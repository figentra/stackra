/**
 * Stackra file contract:
 * Purpose: `specCheckApproval(text)`, the approval stops of ADR 0502: a `feature` spec needs its Planned approval from
 *          Tasked on; a `big` spec needs its Clarified approval from Planned on and its Planned approval from Tasked on;
 *          both name their `**Approver**` past Clarified.
 * Boundary: pure; `trivial`, `small` and a spec with no tier have no stop.
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers and approval stops); ADR 0120; ADR 0362. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */
import { specApprovedAt } from "./spec-approved-at.function.ts";
import { specAtLeast } from "./spec-at-least.function.ts";
import { specStatusOf } from "./spec-status-of.function.ts";
import { specStrip } from "./spec-strip.function.ts";
import { specTierOf } from "./spec-tier-of.function.ts";

/**
 * Problems of a spec's approval stops at its status.
 *
 * @param text - the spec.md text.
 * @example
 * specCheckApproval("**Status**: Tasked\n**Tier**: feature"); // ["status tasked needs the Planned approval ..."]
 */
export function specCheckApproval(text: string): string[] {
  const tier = specTierOf(text);
  if (tier !== "feature" && tier !== "big") return [];
  const status = specStatusOf(text);
  if (status === "abandoned" || status === "superseded") return [];
  const problems: string[] = [];
  if (specAtLeast(status, "planned") && !/^\*\*Approver\*\*:\s*\S/m.test(specStrip(text)))
    problems.push(
      `a ${tier} spec names its \`**Approver**\` (the owner, or the leader for a technical-only stop; ADR 0502)`,
    );
  const stops = tier === "big" ? ["clarified", "planned"] : ["planned"];
  for (const stop of stops) {
    const next = stop === "clarified" ? "planned" : "tasked";
    if (specAtLeast(status, next) && specApprovedAt(text, stop) === undefined)
      problems.push(
        `status ${status} needs the ${stop.charAt(0).toUpperCase()}${stop.slice(1)} approval of a ${tier} spec: "Approved by <who> <YYYY-MM-DD>" on that stage (ADR 0502)`,
      );
  }
  return problems;
}
