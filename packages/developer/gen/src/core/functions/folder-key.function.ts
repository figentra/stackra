/**
 * Stackra file contract:
 * Purpose: `folderKey`, the member and module key derivation: a member's or module's folder name in snake_case.
 * Boundary: pure. The member key is the folder name, never the package name (`commerce` for `services/commerce`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20, 2026-10-23 item 14).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The key of a member or module folder.
 *
 * @example
 * folderKey("loyalty-kit"); // "loyalty_kit"
 */
export function folderKey(folder: string): string {
  return snakeCase(folder);
}
