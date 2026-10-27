/**
 * Stackra file contract:
 * Purpose: `ItemsLockEntry`, one item in `stackra-items.lock.yaml`: its kind, the pinned version and integrity, and
 *          where `stackra add` put it.
 * Boundary: type only; `ITEMS_LOCK_SCHEMA` checks it.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 11).
 */
import type { StackraKind } from "#contracts/enums/stackra-kind.enum";

/** One installed item. */
export type ItemsLockEntry = {
  /** The item kind, which says how the item was installed. */
  readonly kind: Exclude<StackraKind, "package">;
  /** The exact version installed. */
  readonly version: string;
  /** The tarball's SHA-512 integrity, SRI form (`sha512-…`). */
  readonly integrity: string;
  /** Where it went, relative to the workspace root (`.agents/skills/archify`, `.mcp.yaml#mcpServers.github`). */
  readonly target: string;
};
