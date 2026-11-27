/**
 * Stackra file contract:
 * Purpose: `ManifestMember`, one member folder the local MCP serves: `@stackra/repo-checks`'s `WorkspaceMember`
 *          (package name, folder from the root, absolute folder) with its committed `stackra.manifest.json` when gen
 *          has written one.
 * Boundary: type only. The member shape is `@stackra/repo-checks`'s, imported, never copied.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R10: the committed manifest is the contract); ADR 0282 (decision 5).
 */
import type { StackraManifest } from "@stackra/contracts";
import type { WorkspaceMember } from "@stackra/repo-checks/node";

/** A workspace member, with its manifest when it has one. */
export type ManifestMember = WorkspaceMember & {
  /** Its committed manifest; absent until `stackra gen` writes one. */
  readonly manifest?: StackraManifest;
};
