/**
 * Stackra file contract:
 * Purpose: `readReleaseNotes(root)`, every note `stackra upgrade-notes` judges in a repository: each pending
 *          `.changeset/<name>.md` whose front matter bumps an `@stackra/*` package, and each entry of every
 *          `@stackra/*` `CHANGELOG.md` from `UPGRADE_NOTES_FLOOR` on, once per commit (the fixed group writes one
 *          entry into several changelogs; the first changelog that holds its text is kept).
 * Boundary: reads the checkout (skipping `node_modules`, `.git`, `dist` and `.stackra`); writes nothing.
 * Runtime: node
 * Governing contract: ADR 0199 (Enforcement); ADR 0013 (decisions 1 and 5); STA-145.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { UPGRADE_NOTES_FLOOR } from "#node/upgrade/constants/upgrade-notes-floor.constant";
import { compareUpgradeVersions } from "#node/upgrade/functions/compare-upgrade-versions.function";
import type { ReleaseNote } from "#node/upgrade/types/release-note.type";

const SKIPPED = new Set(["node_modules", ".git", "dist", ".stackra"]);

/** Every `CHANGELOG.md` under `folder`, sorted by path. */
function changelogs(folder: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(folder, { withFileTypes: true }).toSorted((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.isDirectory() && !SKIPPED.has(entry.name))
      found.push(...changelogs(join(folder, entry.name)));
    else if (entry.isFile() && entry.name === "CHANGELOG.md") found.push(join(folder, entry.name));
  }
  return found;
}

/** The pending changesets that bump an `@stackra/*` package. */
function changesets(root: string): ReleaseNote[] {
  const folder = join(root, ".changeset");
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .toSorted()
    .flatMap((name) => {
      const raw = readFileSync(join(folder, name), "utf8");
      const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
      if (match === null || !/["']?@stackra\//.test(match[1] ?? "")) return [];
      return [
        {
          file: `.changeset/${name}`,
          kind: "changeset" as const,
          ref: name.slice(0, -".md".length),
          text: (match[2] ?? "").trim(),
        },
      ];
    });
}

/** The entries of one `@stackra/*` changelog from the floor on. */
function entriesOf(root: string, path: string): ReleaseNote[] {
  const lines = readFileSync(path, "utf8").split("\n");
  if (!(lines[0] ?? "").startsWith("# @stackra/")) return [];
  const file = relative(root, path);
  const entries: { ref: string; version: string; lines: string[] }[] = [];
  let version: string | undefined;
  let current: { ref: string; version: string; lines: string[] } | undefined;
  for (const line of lines) {
    const heading = /^## (\d+\.\d+\.\d+)\s*$/.exec(line);
    if (heading !== null) {
      version = heading[1];
      current = undefined;
      continue;
    }
    const entry = /^- ([0-9a-f]{7,40}): (.*)$/.exec(line);
    if (entry !== null && version !== undefined) {
      current = { ref: entry[1] ?? "", version, lines: [entry[2] ?? ""] };
      entries.push(current);
      continue;
    }
    if (current === undefined) continue;
    if (line.startsWith("  ") || line.trim() === "") current.lines.push(line.slice(2));
    else current = undefined;
  }
  return entries
    .filter((entry) => compareUpgradeVersions(entry.version, UPGRADE_NOTES_FLOOR) >= 0)
    .map((entry) => ({
      file,
      kind: "changelog" as const,
      ref: entry.ref,
      version: entry.version,
      text: entry.lines.join("\n").trim(),
    }));
}

/**
 * The repository's pending `@stackra/*` changesets, then its `@stackra/*` changelog entries from the floor on, one per
 * commit, oldest release first.
 *
 * @param root - the repository root.
 * @example
 * readReleaseNotes(root); // [{ file: ".changeset/x.md", kind: "changeset", ref: "x", text: "…" }, …]
 */
export function readReleaseNotes(root: string): readonly ReleaseNote[] {
  const seen = new Map<string, ReleaseNote>();
  for (const path of changelogs(root))
    for (const note of entriesOf(root, path)) {
      const known = seen.get(note.ref);
      // A fixed-group release lists the commit in every changelog; only the packages it named carry its text.
      if (known === undefined || (known.text === "" && note.text !== "")) seen.set(note.ref, note);
    }
  return [
    ...changesets(root),
    ...[...seen.values()].toSorted((a, b) =>
      compareUpgradeVersions(a.version ?? "0.0.0", b.version ?? "0.0.0"),
    ),
  ];
}
