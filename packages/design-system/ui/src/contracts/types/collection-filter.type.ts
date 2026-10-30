/**
 * Stackra file contract:
 * Purpose: `CollectionFilter`, the filter of a collection as a rule tree: "all" or "any" of its conditions and nested groups.
 * Boundary: types only. It is a `RuleGroup` with optional child groups, so a `RuleBuilder` edits any one level as it is.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { RuleGroup } from "#contracts/types/rule-group.type";

/** An and/or group of conditions and nested groups. */
export interface CollectionFilter extends RuleGroup {
  /** The key of a nested group, unique in the tree. */
  readonly id?: string | undefined;
  /** The nested groups, each matched as one more condition of this group. */
  readonly groups?: readonly CollectionFilter[] | undefined;
}
