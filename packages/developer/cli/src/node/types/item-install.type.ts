/**
 * Stackra file contract:
 * Purpose: `ItemInstall`, what `installItem` writes: the item's kind and short name, the files of its tarball and
 *          the `stackra` field of the tarball's own `package.json`.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 11).
 */
import type { StackraKind, StackraManifest } from "@stackra/skills/contracts";

/** One item to install. */
export type ItemInstall = {
  /** The item kind, which picks where `installItem` writes the files. */
  readonly kind: Exclude<StackraKind, "package">;
  /** The short name, `archify` for `@stackra/skill-archify`. */
  readonly name: string;
  /** The tarball's files by path, `package/` removed. */
  readonly files: ReadonlyMap<string, Uint8Array>;
  /** The `stackra` field of the tarball's own `package.json`, read by the kind's installer. */
  readonly manifest: StackraManifest;
};
