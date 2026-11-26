/**
 * Stackra file contract:
 * Purpose: `isWithin(root, folder)`, whether `folder` is `root` or a folder inside it, by path alone: what tells the
 *          member a person stands in for a member command (STA-2888).
 * Boundary: pure; compares resolved paths and reads no file, so a sibling sharing a name prefix
 *           (`services/orders-admin` beside `services/orders`) is not inside.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); STA-2888.
 */
import { isAbsolute, relative, sep } from "node:path";

/**
 * Whether `folder` is `root` or inside it.
 *
 * @param root - the outer folder.
 * @param folder - the folder to place.
 * @example
 * isWithin("/repo/services/orders", "/repo/services/orders/src"); // true
 * isWithin("/repo/services/orders", "/repo/services/orders-admin"); // false
 */
export function isWithin(root: string, folder: string): boolean {
  const path = relative(root, folder);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}
