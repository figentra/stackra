/**
 * Stackra file contract:
 * Purpose: unit tests of `checkUpgradeNotes`, the release gate of `stackra upgrade`: each break mark makes a note a
 *          break; a break is covered by `Upgrade entry: <id>` naming an existing entry, or, released, by an entry
 *          whose `source` names its commit; an uncovered break and a named id no entry has are findings; a note with
 *          no mark passes.
 * Boundary: test only; the notes and entries are literals.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (Enforcement); ADR 0013 (decision 5); STA-145.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkUpgradeNotes } from "#node/upgrade/functions/check-upgrade-notes.function";
import type { ReleaseNote } from "#node/upgrade/types/release-note.type";
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

const ENTRIES: readonly UpgradeCodemod[] = [
  {
    id: "queue-drain",
    version: "0.30.0",
    title: "Drain the queue",
    note: "Drain the queue before you migrate queue.0003; it refuses while a job sits below a tenant node.",
    source: "98a8940, STA-1",
  },
];

const changeset = (text: string): ReleaseNote => ({
  file: ".changeset/x.md",
  kind: "changeset",
  ref: "x",
  text,
});

const changelog = (ref: string, text: string): ReleaseNote => ({
  file: "packages/runtime/queue/CHANGELOG.md",
  kind: "changelog",
  ref,
  version: "0.30.0",
  text,
});

describe("checkUpgradeNotes", () => {
  it.each([
    "Drops `X`.\n\n### Breaking\n\n- `X` is removed.",
    "**Breaking route change.** Every route moves.",
    "Breaking: `Rounding` moves to `@stackra/contracts`.",
    "**Upgrading.** A product's tests now run in the actor's tenant.",
    "The tables are tenant-owned.\n\nUpgrade: drain the relay before you migrate.",
    "Two tables change.\n\nUpgrade, search: delete those rows, then migrate.",
    "Bump step: run `stackra encore:prepare` in each service.",
    "Run `stackra gen` after upgrading.",
    "Before taking this version, a product must have zero such tables.",
    "What a product does on its bump: run `stackra gen`.",
  ])("treats %j as a break that needs an entry", (text) => {
    expect(checkUpgradeNotes([changeset(text)], ENTRIES)).toEqual([
      expect.stringContaining(".changeset/x.md: a break with no stackra upgrade entry"),
    ]);
  });

  it("passes a note with no break mark, even one that names stackra upgrade", () => {
    expect(
      checkUpgradeNotes(
        [changeset("`stackra upgrade` prints the note of every release in between that has one.")],
        ENTRIES,
      ),
    ).toEqual([]);
  });

  it("passes a break that names an existing entry, in backticks or not", () => {
    expect(
      checkUpgradeNotes(
        [
          changeset("### Breaking\n\n- `X` is removed.\n\nUpgrade entry: `queue-drain`"),
          changeset("Upgrade: drain the queue.\n\nUpgrade entry: queue-drain"),
        ],
        ENTRIES,
      ),
    ).toEqual([]);
  });

  it("refuses a named entry that does not exist, break or not", () => {
    expect(
      checkUpgradeNotes(
        [
          changeset("### Breaking\n\nUpgrade entry: `queue-drains`"),
          changeset("Upgrade entry: nope"),
        ],
        ENTRIES,
      ),
    ).toEqual([
      ".changeset/x.md: names upgrade entry queue-drains, which UPGRADE_CODEMODS does not have",
      expect.stringContaining(".changeset/x.md: a break with no stackra upgrade entry"),
      ".changeset/x.md: names upgrade entry nope, which UPGRADE_CODEMODS does not have",
    ]);
  });

  it("covers a released break by the commit an entry's source names, and only a released one", () => {
    expect(
      checkUpgradeNotes(
        [
          changelog("98a8940", "Upgrade: drain the queue before you migrate."),
          changelog("98a8941", "Upgrade: drain the scheduler before you migrate."),
          changeset(
            "Upgrade: 98a8940 is named, but a changeset is covered only by its entry line.",
          ),
        ],
        ENTRIES,
      ),
    ).toEqual([
      expect.stringMatching(
        /^packages\/runtime\/queue\/CHANGELOG\.md 0\.30\.0 98a8941: a break with no stackra upgrade entry/,
      ),
      expect.stringContaining(".changeset/x.md: a break with no stackra upgrade entry"),
    ]);
  });
});
