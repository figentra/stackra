/**
 * Stackra file contract:
 * Purpose: `checkPlacement(root, members)`, the topology placement check of a parsed root runway against the
 *          repository's service members: in a grouped environment every member sits in exactly one group (or in the
 *          `default` group when no group lists it), every listed member exists, `default` names a group, and `isolate`
 *          names members only.
 * Boundary: pure; returns every failure instead of throwing, for `stackra validate` to print. The member list is the
 *           caller's (the service members of the workspace); runway does not read the workspace.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 2 and consequences: nothing runs unplaced; enforcement).
 */
import { Enum } from "@stackra/contracts";

import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { TopologyMode } from "#core/enums/topology-mode.enum";
import type { PlacementIssue } from "#core/types/placement-issue.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * Every placement failure of `root`, environment by environment in promotion order; `[]` when all are placed.
 *
 * @param root - the parsed root runway.
 * @param members - the service member keys of the repository.
 * @example
 * checkPlacement(root, ["commerce", "notifications", "billing"]);
 * // [{ environment: "production", code: "member_unplaced", subject: "billing", message: "…" }]
 */
export function checkPlacement(root: RootRunway, members: readonly string[]): PlacementIssue[] {
  const known = new Set(members);
  const issues: PlacementIssue[] = [];
  for (const environment of Enum.values(RunwayEnvironment)) {
    const topology = root.environments[environment]?.topology;
    if (topology === undefined) continue;
    for (const member of topology.isolate ?? []) {
      if (!known.has(member)) {
        issues.push({
          environment,
          code: "isolate_unknown_member",
          subject: member,
          message: `${environment}: isolate names "${member}", which is not a service member`,
        });
      }
    }
    if (topology.mode !== TopologyMode.Grouped) continue;
    const groups = topology.groups ?? {};
    if (topology.default !== undefined && !Object.hasOwn(groups, topology.default)) {
      issues.push({
        environment,
        code: "unknown_default_group",
        subject: topology.default,
        message: `${environment}: default names the group "${topology.default}", which is not declared`,
      });
    }
    const placed = new Map<string, string>();
    for (const [group, { members: listed }] of Object.entries(groups)) {
      for (const member of listed) {
        const first = placed.get(member);
        if (!known.has(member)) {
          issues.push({
            environment,
            code: "unknown_member",
            subject: member,
            message: `${environment}: group "${group}" lists "${member}", which is not a service member`,
          });
        } else if (first !== undefined) {
          issues.push({
            environment,
            code: "member_placed_twice",
            subject: member,
            message: `${environment}: "${member}" is placed in "${first}" and in "${group}"`,
          });
        } else {
          placed.set(member, group);
        }
      }
    }
    if (topology.default !== undefined) continue;
    for (const member of members) {
      if (!placed.has(member)) {
        issues.push({
          environment,
          code: "member_unplaced",
          subject: member,
          message: `${environment}: "${member}" is in no group and the topology has no default group`,
        });
      }
    }
  }
  return issues;
}
