/**
 * Stackra file contract:
 * Purpose: `collectionFilterMatches()`, whether a record meets a collection's rule tree: "all" or "any" of its conditions and nested groups.
 * Boundary: pure; each condition is `ruleMatches`' own test, so the operators mean the same in a RuleBuilder and a collection. An empty group matches.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import { ruleMatches } from "#core/functions/rule-matches.function";

/**
 * Whether `record` meets the rule tree.
 * @param filter - the root group
 * @param record - the row, read by field
 */
export function collectionFilterMatches(
  filter: CollectionFilter,
  record: Readonly<Record<string, unknown>>,
): boolean {
  const tests = [
    ...filter.conditions.map(
      (condition) => () => ruleMatches({ match: "all", conditions: [condition] }, record),
    ),
    ...(filter.groups ?? [])
      .filter((group) => !isEmptyFilter(group))
      .map((group) => () => collectionFilterMatches(group, record)),
  ];
  if (tests.length === 0) return true;
  return filter.match === "all" ? tests.every((test) => test()) : tests.some((test) => test());
}

/** True for a group with no condition anywhere below it. */
function isEmptyFilter(filter: CollectionFilter): boolean {
  return filter.conditions.length === 0 && (filter.groups ?? []).every(isEmptyFilter);
}
