/**
 * Stackra file contract:
 * Purpose: unit tests of `breakingReleases`: a released version from the floor on with a break-marked changelog entry
 *          is breaking, once per commit; a note that calls itself non-breaking, an older release, another scope's
 *          changelog and a changeset that bumps no `@stackra/*` package are not; a break-marked pending changeset
 *          names the version the largest pending bump releases.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0013 (decision 5); STA-2835; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { breakingReleases } from "#node/functions/breaking-releases.function";

/** A changelog of `name` with the given body. */
const changelog = (name: string, body: string) => ({
  path: `packages/${name}/CHANGELOG.md`,
  text: `# @stackra/${name}\n\n${body}`,
});

const A = changelog(
  "a",
  [
    "## 0.31.0",
    "",
    "### Minor Changes",
    "",
    "- abc1234: The port gains `x`.",
    "",
    "  After upgrading, run `stackra gen`.",
    "",
    "- def5678: A new option; non-breaking.",
    "",
    "### Patch Changes",
    "",
    "- Updated dependencies [abc1234]",
    "",
    "## 0.30.1",
    "",
    "### Patch Changes",
    "",
    "- 1111111: A fix.",
    "",
    "## 0.29.0",
    "",
    "### Minor Changes",
    "",
    "- 2222222: **Breaking route change.** Every route moves.",
    "",
  ].join("\n"),
);

/** A pending changeset bumping `packages` with `body`. */
const changeset = (name: string, packages: string, body: string) => ({
  path: `.changeset/${name}.md`,
  text: `---\n${packages}\n---\n\n${body}\n`,
});

describe("breakingReleases", () => {
  it("lists a released break from the floor on, a continuation line's mark included", () => {
    expect(breakingReleases([A], [])).toEqual([
      { version: "0.31.0", refs: ["abc1234"], pending: false },
    ]);
  });

  it("keeps one ref per commit across the fixed group's changelogs, oldest release first", () => {
    const b = changelog(
      "b",
      "## 0.33.1\n\n### Patch Changes\n\n- 3333333: Upgrade: run `stackra encore:prepare`.\n\n## 0.31.0\n\n### Minor Changes\n\n- abc1234: The port gains `x`. Breaking for a custom driver.\n",
    );
    expect(breakingReleases([b, A], [])).toEqual([
      { version: "0.31.0", refs: ["abc1234"], pending: false },
      { version: "0.33.1", refs: ["3333333"], pending: false },
    ]);
  });

  it("ignores another scope's changelog and a repository without @stackra changelogs", () => {
    const other = {
      path: "apps/docs/CHANGELOG.md",
      text: "# @figentra/docs\n\n## 0.40.0\n\n### Minor Changes\n\n- 4444444: Breaking: a page moved.\n",
    };
    expect(breakingReleases([other], [])).toEqual([]);
    expect(breakingReleases([], [])).toEqual([]);
  });

  it("names the version the largest pending bump releases when a pending changeset is break-marked", () => {
    const marked = changeset(
      "drop-x",
      '"@stackra/a": minor',
      "Before taking this version, remove `x`.",
    );
    expect(breakingReleases([A], [marked])).toEqual([
      { version: "0.31.0", refs: ["abc1234"], pending: false },
      { version: "0.32.0", refs: [".changeset/drop-x.md"], pending: true },
    ]);
    const major = changeset("one", "'@stackra/b': major", "Stable at last.");
    expect(breakingReleases([A], [marked, major]).at(-1)).toEqual({
      version: "1.0.0",
      refs: [".changeset/drop-x.md"],
      pending: true,
    });
    const patch = changeset("fix", "@stackra/a: patch", "Bump step: run `stackra gen`.");
    expect(breakingReleases([A], [patch]).at(-1)?.version).toBe("0.31.1");
  });

  it("adds no pending release for an unmarked changeset or one that bumps no @stackra package", () => {
    const plain = changeset("feature", '"@stackra/a": minor', "A new option.");
    const docs = changeset("docs", '"@figentra/docs": minor', "Breaking: a page moved.");
    expect(breakingReleases([A], [plain, docs]).some((release) => release.pending)).toBe(false);
  });
});
