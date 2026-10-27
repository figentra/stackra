/**
 * Stackra file contract:
 * Purpose: `subjectOf`, the subject a resolved market gives one rule kind: the `subjects` entry whose key is the rule
 *          kind or its longest dotted prefix, a later layer winning over an earlier one for the same key.
 * Boundary: pure and internal (used by `MarketContext`). `tenant` when no layer names one, so a pack that declares no
 *           subjects answers from the tenant's own market as before.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (the subject rule).
 */
import { PackSubject } from "#core/enums/pack-subject.enum";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/**
 * The subject of `ruleKind` in `resolved`.
 *
 * @example
 * subjectOf(resolved, "tax.sales.rate"); // "buyer" when a layer maps "tax.sales" to buyer
 */
export function subjectOf(resolved: ResolvedPack, ruleKind: string): PackSubject {
  let found: PackSubject = PackSubject.Scope;
  let length = -1;
  for (const layer of resolved.layers)
    for (const item of layer.subjects ?? [])
      if (
        (ruleKind === item.key || ruleKind.startsWith(`${item.key}.`)) &&
        item.key.length >= length
      ) {
        found = item.subject;
        length = item.key.length;
      }
  return found;
}
