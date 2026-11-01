/**
 * Stackra file contract:
 * Purpose: `ManifestMember`, one member of the pnpm workspace as `readManifestMembers` reads it: its folder, its npm
 *          name and its parsed package.json.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1373 (the shared workspace member reader).
 */
import type { PackageManifest } from "@stackra/repo-checks/node";

/** One workspace member with a name. */
export type ManifestMember = {
  /** The member folder, repository-relative (`packages/data/model`). */
  readonly dir: string;

  /** The npm name from its package.json. */
  readonly name: string;

  /** Its parsed package.json. */
  readonly manifest: PackageManifest;
};
