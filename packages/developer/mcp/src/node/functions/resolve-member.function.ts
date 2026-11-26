/**
 * Stackra file contract:
 * Purpose: `resolveMember(root, given)`, the member a tool call names: by its manifest key (`commerce`), its package
 *          name (`@acme/service-commerce`) or its folder from the root (`services/commerce`).
 * Boundary: reads the member folders only (`readMembers`). An unknown name is a `CommandError` that lists the members,
 *           so an assistant can correct its call.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0294 (rule R10).
 */
import { CommandError } from "@stackra/console";

import { readMembers } from "#node/functions/read-members.function";
import type { WorkspaceMember } from "#node/types/workspace-member.type";

/**
 * The member `given` names.
 *
 * @param root - the repository root.
 * @param given - a manifest key, a package name or a folder from the root.
 * @throws CommandError when no member answers to `given`.
 * @example
 * resolveMember("/repo", "commerce").path; // "services/commerce"
 */
export function resolveMember(root: string, given: string): WorkspaceMember {
  const path = given.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
  const members = readMembers(root);
  const found = members.find(
    (member) =>
      member.path === path || member.packageName === given || member.manifest?.member === given,
  );
  if (found !== undefined) return found;
  throw new CommandError(`No member named ${JSON.stringify(given)}`, {
    fix: `name one of: ${members.map((member) => member.manifest?.member ?? member.path).join(", ")}`,
  });
}
