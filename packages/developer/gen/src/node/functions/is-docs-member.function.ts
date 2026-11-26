/**
 * Stackra file contract:
 * Purpose: `isDocsMember`, whether the member at a root is a docs member: its `package.json` has `stackra.kind`
 *          `docs` (pages and `meta.json` navigation under `content/`, settings in `docs.yaml`, no code), by the kind
 *          and never by the folder or package name. `generate` then takes the docs-site run.
 * Boundary: reads the member's own `package.json`; a member with none, or one that does not parse, is not a docs
 *           member. Writes nothing.
 * Runtime: node
 * Governing contract: ADR 0514 (decision 10 and the amendment of 2026-11-09: the docs member).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * True when the member at `root` declares `stackra.kind` `docs`.
 *
 * @param root - the member root.
 * @example
 * isDocsMember("/repo/docs"); // true
 */
export function isDocsMember(root: string): boolean {
  const path = join(root, "package.json");
  if (!existsSync(path)) return false;
  try {
    const { stackra } = JSON.parse(readFileSync(path, "utf8")) as {
      stackra?: { kind?: unknown };
    };
    // `StackraKind.Docs` of @stackra/skills; gen does not depend on that package, so the value is compared here.
    return stackra?.kind === "docs";
  } catch {
    return false;
  }
}
