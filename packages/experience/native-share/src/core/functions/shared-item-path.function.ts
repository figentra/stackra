/**
 * Stackra file contract:
 * Purpose: `sharedItemPath(item, folder)`, the disk key a shared file is kept under: a fresh time-and-random prefix
 *          and the file's own name inside `folder`, made safe to be one key segment.
 * Boundary: the name comes from another app, so a slash, a backslash, a NUL or a `..` never reaches the disk as a path
 *           step; a file with no name is called `shared`. The prefix keeps a second `image.jpg` from overwriting one
 *           already kept (the disk write overwrites). Not pure (clock and random); pass the result to `keepSharedItem`.
 * Runtime: isomorphic
 * Governing contract: ADR 0465 (one FileSystem port); ADR 0478 (decision 5).
 */
import type { SharedItem } from "#contracts/types/shared-item.type";

/**
 * The key a shared file is kept under.
 *
 * @example
 * await keepSharedItem(share, item, files, sharedItemPath(item)); // "inbox/mf3k2a9x4q-My Scan.pdf"
 */
export function sharedItemPath(item: SharedItem, folder = "inbox"): string {
  const name = (item.name ?? "").replaceAll(/[/\\\0]/g, "_").trim();
  const prefix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${folder}/${prefix}-${name === "" || /^\.+$/.test(name) ? "shared" : name}`;
}
