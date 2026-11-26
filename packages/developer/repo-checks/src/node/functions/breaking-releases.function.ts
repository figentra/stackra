/**
 * Stackra file contract:
 * Purpose: `breakingReleases(changelogs, changesets)`, the `@stackra/*` releases a consumer must act on: each released
 *          version from `RELEASE_NOTES_FLOOR` on with a changelog entry that carries a break mark
 *          (`RELEASE_BREAK_PATTERN`), and, when a pending `@stackra/*` changeset carries one, the version the pending
 *          changesets will release (the fixed group moves the newest released version by the largest pending bump).
 * Boundary: pure; reads only changelogs whose first line is `# @stackra/<name>` and changesets whose front matter bumps
 *           an `@stackra/*` package, so a product repository yields nothing.
 * Runtime: node
 * Governing contract: ADR 0013 (decisions 1 and 5); ADR 0177 (PK5, the fixed version group); STA-2835.
 */
import { RELEASE_BREAK_PATTERN } from "#node/constants/release-break-pattern.constant";
import { RELEASE_NOTES_FLOOR } from "#node/constants/release-notes-floor.constant";
import type { BreakingRelease } from "#node/types/breaking-release.type";
import type { ReleaseSource } from "#node/types/release-source.type";

/** The three numbers of an `x.y.z` version. */
const partsOf = (version: string): [number, number, number] => {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  return [major, minor, patch];
};

/** Negative, zero or positive as `a` is before, equal to or after `b`. */
const compare = (a: string, b: string): number => {
  const [x, y] = [partsOf(a), partsOf(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/** The bumps, smallest first. */
const BUMPS = ["patch", "minor", "major"] as const;

/** `version` moved by `bump`, as Changesets moves it. */
const bumped = (version: string, bump: (typeof BUMPS)[number]): string => {
  const [major, minor, patch] = partsOf(version);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

/** Each entry of one `@stackra/*` changelog: its version, commit and text without the list indentation. */
function entriesOf(text: string): { version: string; ref: string; text: string }[] {
  const entries: { version: string; ref: string; lines: string[] }[] = [];
  let version: string | undefined;
  let current: (typeof entries)[number] | undefined;
  for (const line of text.split("\n")) {
    const heading = /^## (\d+\.\d+\.\d+)\s*$/.exec(line);
    if (heading !== null) {
      version = heading[1];
      current = undefined;
      continue;
    }
    const entry = /^- ([0-9a-f]{7,40}): (.*)$/.exec(line);
    if (entry !== null && version !== undefined) {
      current = { version, ref: entry[1] ?? "", lines: [entry[2] ?? ""] };
      entries.push(current);
      continue;
    }
    if (current === undefined) continue;
    if (line.startsWith("  ") || line.trim() === "") current.lines.push(line.slice(2));
    else current = undefined;
  }
  return entries.map(({ version: at, ref, lines }) => ({
    version: at,
    ref,
    text: lines.join("\n"),
  }));
}

/**
 * The breaking releases, oldest first.
 *
 * @param changelogs - the repository's `CHANGELOG.md` files; those of other scopes are ignored.
 * @param changesets - the pending `.changeset/*.md` files (not `README.md`).
 * @example
 * breakingReleases([{ path: "packages/a/CHANGELOG.md", text: "# @stackra/a\n\n## 0.31.0\n\n### Minor Changes\n\n- abc1234: Breaking: …\n" }], []);
 * // [{ version: "0.31.0", refs: ["abc1234"], pending: false }]
 */
export function breakingReleases(
  changelogs: readonly ReleaseSource[],
  changesets: readonly ReleaseSource[],
): readonly BreakingRelease[] {
  const released = new Map<string, Set<string>>();
  let newest: string | undefined;
  for (const { text } of changelogs) {
    if (!text.startsWith("# @stackra/")) continue;
    for (const [, version = ""] of text.matchAll(/^## (\d+\.\d+\.\d+)\s*$/gm))
      if (newest === undefined || compare(version, newest) > 0) newest = version;
    for (const entry of entriesOf(text)) {
      if (
        compare(entry.version, RELEASE_NOTES_FLOOR) < 0 ||
        !RELEASE_BREAK_PATTERN.test(entry.text)
      )
        continue;
      released.set(entry.version, (released.get(entry.version) ?? new Set()).add(entry.ref));
    }
  }
  const releases: BreakingRelease[] = [...released]
    .toSorted(([a], [b]) => compare(a, b))
    .map(([version, refs]) => ({ version, refs: [...refs], pending: false }));

  let bump = -1;
  const marked: string[] = [];
  for (const { path, text } of changesets) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
    if (match === null) continue;
    const bumps = [...(match[1] ?? "").matchAll(/^\s*["']?@stackra\/[^"':\s]+["']?\s*:\s*(\w+)/gm)];
    if (bumps.length === 0) continue;
    for (const [, kind = ""] of bumps)
      bump = Math.max(bump, BUMPS.indexOf(kind as (typeof BUMPS)[number]));
    if (RELEASE_BREAK_PATTERN.test(match[2] ?? "")) marked.push(path);
  }
  if (marked.length > 0 && newest !== undefined && bump >= 0)
    releases.push({ version: bumped(newest, BUMPS[bump] ?? "patch"), refs: marked, pending: true });
  return releases;
}
