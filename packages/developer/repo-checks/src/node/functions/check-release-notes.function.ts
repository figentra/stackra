/**
 * Stackra file contract:
 * Purpose: `checkReleaseNotes(releases, notes)`, the release-note rule (ADR 0013 decision 5): every breaking
 *          `@stackra/*` release has its line's upgrade note (`releaseNotePath`), the note has each of
 *          `RELEASE_NOTE_SECTIONS` as a `##` heading, and a break released after the line's first version (a breaking
 *          patch) is named in the note by its version.
 * Boundary: pure; `releaseNoteFindings` reads the files.
 * Runtime: node
 * Governing contract: ADR 0013 (decision 5); ADR 0025 (decision 5); STA-2835.
 */
import { RELEASE_NOTE_SECTIONS } from "#node/constants/release-note-sections.constant";
import { releaseNotePath } from "#node/functions/release-note-path.function";
import type { BreakingRelease } from "#node/types/breaking-release.type";

/** At most three refs, then how many more. */
const named = (refs: readonly string[]): string =>
  refs.length <= 3 ? refs.join(", ") : `${refs.slice(0, 3).join(", ")} and ${refs.length - 3} more`;

/** True when `version` opens its release line (`0.y.0` before 1.0.0, `x.0.0` after). */
const opensLine = (version: string): boolean => {
  const [major, minor, patch] = version.split(".");
  return patch === "0" && (major !== "0" ? minor === "0" : true);
};

/**
 * One finding per missing note, missing section and unnamed breaking patch; empty when every break has its note.
 *
 * @param releases - the breaking releases, from `breakingReleases`.
 * @param notes - each upgrade note's repository-relative path and text.
 * @example
 * checkReleaseNotes([{ version: "0.34.0", refs: [".changeset/x.md"], pending: true }], new Map());
 * // ["apps/docs/src/docs/customers/upgrading/0-34.mdx: missing: 0.34.0 (pending) carries a break (.changeset/x.md); …"]
 */
export function checkReleaseNotes(
  releases: readonly BreakingRelease[],
  notes: ReadonlyMap<string, string>,
): string[] {
  const findings = new Set<string>();
  for (const { version, refs, pending } of releases) {
    const path = releaseNotePath(version);
    const carries = `carries a break (${named(refs)})`;
    const text = notes.get(path);
    if (text === undefined) {
      findings.add(
        `${path}: missing: ${version}${pending ? " (pending)" : ""} ${carries}; write its upgrade note with the sections ${RELEASE_NOTE_SECTIONS.join(", ")} (ADR 0013 decision 5)`,
      );
      continue;
    }
    for (const section of RELEASE_NOTE_SECTIONS)
      if (!new RegExp(`^## ${section}\\s*$`, "m").test(text))
        findings.add(`${path}: no "## ${section}" section (ADR 0013 decision 5)`);
    if (
      !opensLine(version) &&
      !new RegExp(`(^|[^\\d.])${version.replaceAll(".", "\\.")}(?![\\d])`).test(text)
    )
      findings.add(`${path}: does not name ${version}, which ${carries}; add what it changes`);
  }
  return [...findings];
}
