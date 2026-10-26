/**
 * Stackra file contract:
 * Purpose: `dropSameMeaning(earlier, incoming)`, removes from a phase's findings those that repeat an earlier phase's
 *          finding on the same file under `SAME_MEANING_RULES`, and notes on the first kept finding of that file that
 *          the later tool agrees.
 * Boundary: pure; returns new arrays and never mutates its arguments.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the stackra core baseline of 2026-10-27.
 */
import type { Finding } from "@stackra/repo-checks/node";

import { SAME_MEANING_RULES } from "#node/constants/same-meaning-rules.constant";

/**
 * The earlier findings (with agreement notes) and the incoming ones minus the repeats.
 *
 * @param earlier - every finding of the phases already run.
 * @param incoming - the findings of the phase that just ran.
 * @example
 * dropSameMeaning(lintFindings, genFindings).incoming; // gen's findings minus two_declarations_in_file repeats
 */
export function dropSameMeaning(
  earlier: readonly Finding[],
  incoming: readonly Finding[],
): { readonly earlier: readonly Finding[]; readonly incoming: readonly Finding[] } {
  const kept = [...earlier];
  const noted = new Set<number>();
  const rest = incoming.filter((finding) => {
    const keep = SAME_MEANING_RULES[`${finding.phase}:${finding.rule}`];
    if (keep === undefined) return true;
    const index = kept.findIndex(
      (other) => `${other.phase}:${other.rule}` === keep && other.path === finding.path,
    );
    if (index === -1) return true;
    if (!noted.has(index)) {
      noted.add(index);
      const other = kept[index] as Finding;
      kept[index] = {
        ...other,
        message: `${other.message} (${finding.tool} ${finding.rule} agrees)`,
      };
    }
    return false;
  });
  return { earlier: kept, incoming: rest };
}
