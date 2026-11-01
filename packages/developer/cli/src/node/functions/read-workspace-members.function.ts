/**
 * Stackra file contract:
 * Purpose: `readManifestMembers(root)`, every workspace member under `root`: its folder (repository-relative), name and
 *          parsed package.json, sorted by folder. The package-cycle check, the architecture map, the duplicate-export,
 *          `any` and duplication ratchets and the Expo native-dependency check share it (moved from
 *          `tools/scripts/package-cycles.mjs`).
 * Boundary: reads pnpm-workspace.yaml and each member's package.json; writes nothing. `!` globs are skipped, not
 *           subtracted, as the script did.
 * Runtime: node
 * Governing contract: ADR 0003; ADR 0117; STA-1373.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { PackageManifest } from "@stackra/repo-checks/node";
import { parse } from "yaml";

import { sorted } from "#node/functions/sorted.function";
import type { ManifestMember } from "#node/types/manifest-member.type";

/**
 * Expands one workspace glob into the folders it matches, relative to `root`.
 * shortcut: only literal and `*` segments (the globs pnpm-workspace.yaml uses); add `**` or negation when a glob needs it.
 */
function expand(root: string, pattern: string): string[] {
  let dirs = [""];
  for (const segment of pattern.split("/").filter(Boolean)) {
    dirs = dirs.flatMap((dir) => {
      if (segment !== "*") return existsSync(join(root, dir, segment)) ? [join(dir, segment)] : [];
      if (!existsSync(join(root, dir))) return [];
      return readdirSync(join(root, dir), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => join(dir, entry.name));
    });
  }
  return dirs;
}

/**
 * Every workspace member under `root` that has a name, sorted by folder.
 *
 * @param root - the folder holding pnpm-workspace.yaml.
 * @example
 * readManifestMembers(root); // [{ dir: "apps/docs", name: "@figentra/docs", manifest: {...} }, ...]
 */
export function readManifestMembers(root: string): ManifestMember[] {
  const { packages = [] } = (parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")) ??
    {}) as { packages?: string[] };
  const dirs = new Set(
    packages.filter((glob) => !glob.startsWith("!")).flatMap((glob) => expand(root, glob)),
  );
  return sorted([...dirs].filter((dir) => existsSync(join(root, dir, "package.json"))))
    .map((dir) => {
      const manifest = JSON.parse(
        readFileSync(join(root, dir, "package.json"), "utf8"),
      ) as PackageManifest;
      return { dir, name: manifest.name, manifest };
    })
    .filter((member): member is ManifestMember => typeof member.name === "string");
}
