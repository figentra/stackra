/**
 * Stackra file contract:
 * Purpose: `groupsFor(suffix)`, the v3 home groups of a kind suffix, in modules and in apps.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 14, rule R1).
 */
import { APP_GROUPS } from "#node/constants/app-groups.constant";
import { MODULE_GROUPS } from "#node/constants/module-groups.constant";
import type { StructureGroup } from "#node/types/structure-group.type";

/**
 * The groups that hold `suffix`, in modules and in apps (empty when no group holds it).
 *
 * @param suffix - for example `action` or `change`.
 * @example
 * groupsFor("change"); // { module: ["schemas", "events"], app: [] }
 */
export function groupsFor(suffix: string): { module: string[]; app: string[] } {
  const homes = (table: readonly StructureGroup[]): string[] =>
    table.filter((g) => g.suffixes.includes(suffix)).map((g) => g.group);
  return { module: homes(MODULE_GROUPS), app: homes(APP_GROUPS) };
}
