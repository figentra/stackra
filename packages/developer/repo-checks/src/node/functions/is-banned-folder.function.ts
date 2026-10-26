/**
 * Stackra file contract:
 * Purpose: `isBannedFolder(name)`, whether a folder name is banned anywhere in a member.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0126 (decision 3); ADR 0130 (decision 4).
 */
import { BANNED_FOLDERS } from "#node/constants/banned-folders.constant";

/**
 * True when a folder called `name` may not exist in a member.
 *
 * @param name - a folder name, no path.
 * @example
 * isBannedFolder("utils"); // true
 */
export function isBannedFolder(name: string): boolean {
  return BANNED_FOLDERS.some((b) => b.name === name);
}
