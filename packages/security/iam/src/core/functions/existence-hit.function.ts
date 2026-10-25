/**
 * Stackra file contract:
 * Purpose: `existenceHit`, what a principal meets for one record a search or a conflict check found: the record when
 *          the `see` capability allows it, else an existence-only hit (id and model) when `exists` allows it, else
 *          nothing.
 * Boundary: pure; the two decisions are `PolicyDecisionPointService.visibility`'s for `Capability.See` and
 *           `Capability.Exists`. Only an explicit `Allow` shows anything: `Abstain` and `Deny` hide (fail closed), so a
 *           wall that denies `see` still lets a conflict check learn that a matter exists only when a rule allows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decisions 2, 3 and 7); STA-595 (existence-only hits).
 */
import type { PublicId } from "@stackra/contracts";

import { Decision } from "#core/enums/decision.enum";
import type { SearchHit } from "#core/types/search-hit.type";

/**
 * The hit `record` gives.
 *
 * @example
 * const hit = existenceHit(matter, matter.id, "matters.matter", see, exists);
 */
export function existenceHit<T>(
  record: T,
  id: PublicId,
  model: string,
  see: Decision,
  exists: Decision,
): SearchHit<T> | null {
  if (see === Decision.Allow) return { kind: "full", record };
  if (exists === Decision.Allow) return { kind: "exists", id, model };
  return null;
}
