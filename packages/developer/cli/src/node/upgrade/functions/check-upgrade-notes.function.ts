/**
 * Stackra file contract:
 * Purpose: `checkUpgradeNotes(notes, codemods)`, the release gate of `stackra upgrade` (ADR 0199 Enforcement): every
 *          note that carries a break mark (`BREAKING_NOTE_PATTERN`) must have an `UPGRADE_CODEMODS` entry, so a
 *          consumer's upgrade prints its note and runs its codemod. A note is covered when it names an existing
 *          entry with `Upgrade entry: <id>`, or, for a released changelog entry, when an entry's `source` names its
 *          commit. A named id that no entry has is a finding of its own.
 * Boundary: pure; `readReleaseNotes` reads the notes.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2 and Enforcement); ADR 0013 (decision 5); STA-145.
 */
import { BREAKING_NOTE_PATTERN } from "#node/upgrade/constants/breaking-note-pattern.constant";
import { UPGRADE_ENTRY_PATTERN } from "#node/upgrade/constants/upgrade-entry-pattern.constant";
import type { ReleaseNote } from "#node/upgrade/types/release-note.type";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/**
 * One finding per break with no upgrade entry and per named entry that does not exist; empty when every break is
 * covered.
 *
 * @param notes - the notes, from `readReleaseNotes`.
 * @param codemods - the entries, `UPGRADE_CODEMODS`.
 * @example
 * checkUpgradeNotes(notes, UPGRADE_CODEMODS);
 * // [".changeset/drop-x.md: a break with no stackra upgrade entry: add one to UPGRADE_CODEMODS and name it …"]
 */
export function checkUpgradeNotes(
  notes: readonly ReleaseNote[],
  codemods: readonly UpgradeCodemod[],
): readonly string[] {
  const ids = new Set(codemods.map((codemod) => codemod.id));
  const findings: string[] = [];
  for (const note of notes) {
    const at = note.kind === "changeset" ? note.file : `${note.file} ${note.version} ${note.ref}`;
    const named = [...note.text.matchAll(UPGRADE_ENTRY_PATTERN)].map((match) => match[1] ?? "");
    for (const id of named.filter((name) => !ids.has(name)))
      findings.push(`${at}: names upgrade entry ${id}, which UPGRADE_CODEMODS does not have`);
    if (!BREAKING_NOTE_PATTERN.test(note.text)) continue;
    const covered =
      named.some((name) => ids.has(name)) ||
      (note.kind === "changelog" &&
        codemods.some((codemod) => new RegExp(`\\b${note.ref}\\b`).test(codemod.source)));
    if (!covered)
      findings.push(
        `${at}: a break with no stackra upgrade entry: add one to UPGRADE_CODEMODS (a codemod, or a note when nothing can be changed mechanically) and write "Upgrade entry: <id>" in the note`,
      );
  }
  return findings;
}
