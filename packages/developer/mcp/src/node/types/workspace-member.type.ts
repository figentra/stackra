/**
 * Stackra file contract:
 * Purpose: `WorkspaceMember`, one member folder of the repository the local MCP serves: its path from the root and,
 *          when gen has written one, its committed `stackra.manifest.json`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R10: the committed manifest is the contract); ADR 0282 (decision 5).
 */
import type { StackraManifest } from "@stackra/contracts";

/** A member folder, with its manifest when it has one. */
export type WorkspaceMember = {
  /** The folder from the repository root, with `/` separators (`packages/data/search`). */
  readonly path: string;
  /** The package name from its `package.json`, when it has one. */
  readonly packageName?: string;
  /** Its committed manifest; absent until `stackra gen` writes one. */
  readonly manifest?: StackraManifest;
};
