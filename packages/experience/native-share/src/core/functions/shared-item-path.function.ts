/**
 * Stackra file contract:
 * Purpose: `sharedItemPath(item, folder)`, the disk key a shared file is kept under: the file's own name inside
 *          `folder`, made safe to be one key segment.
 * Boundary: the name comes from another app, so a slash, a backslash, a NUL or a `..` never reaches the disk as a path
 *           step; a file with no name gets a time-based one. Pure; pass the result to `keepSharedItem`.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (one FileSystem port); ADR 0478 (decision 5).
 */
import type { SharedItem } from "#contracts/types/shared-item.type";

/**
 * The key a shared file is kept under.
 *
 * @example
 * await keepSharedItem(share, item, files, sharedItemPath(item)); // "inbox/My Scan.pdf"
 */
export function sharedItemPath(item: SharedItem, folder = "inbox"): string {
  const name = (item.name ?? "").replaceAll(/[/\\\0]/g, "_").trim();
  return `${folder}/${name === "" || /^\.+$/.test(name) ? `shared-${Date.now().toString(36)}` : name}`;
}
