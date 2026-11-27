/**
 * Stackra file contract:
 * Purpose: `linkFolder(link, target)`, a folder link the local monolith app keeps current: each member's
 *          `node_modules` and the app root's point at the real ones, so the copy resolves packages as the member does.
 * Boundary: internal to `./node`, not re-exported. Replaces a link to anything else; does nothing when `target` does
 *           not exist.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); STA-2840.
 */
import { existsSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Points `link` at `target`.
 *
 * @example
 * linkFolder("/repo/.stackra/dev/encore/services/billing/node_modules", "/repo/services/billing/node_modules");
 */
export function linkFolder(link: string, target: string): void {
  if (!existsSync(target)) return;
  try {
    if (readlinkSync(link) === target) return;
  } catch {
    // no link yet, or a plain file or folder in its place
  }
  rmSync(link, { recursive: true, force: true });
  mkdirSync(dirname(link), { recursive: true });
  symlinkSync(target, link, "dir");
}
