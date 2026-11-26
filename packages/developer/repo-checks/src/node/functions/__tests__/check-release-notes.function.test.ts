/**
 * Stackra file contract:
 * Purpose: unit tests of `checkReleaseNotes`: a complete note passes; a missing note, a missing section and a breaking
 *          patch the note does not name are findings, each once.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0013 (decision 5); STA-2835; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkReleaseNotes } from "#node/functions/check-release-notes.function";

const PAGE = "apps/docs/src/docs/customers/upgrading/0-33.mdx";
const NOTE = [
  "---",
  'title: "Upgrade to 0.33"',
  "---",
  "",
  "## What changes",
  "",
  "### 0.33.1",
  "",
  "## Pins",
  "",
  "## Steps",
  "",
  "## Verify",
  "",
  "## Roll back",
  "",
].join("\n");

describe("checkReleaseNotes", () => {
  it("passes a complete note that names its breaking patch", () => {
    const releases = [
      { version: "0.33.0", refs: ["6186329"], pending: false },
      { version: "0.33.1", refs: ["d60f9d5"], pending: false },
    ];
    expect(checkReleaseNotes(releases, new Map([[PAGE, NOTE]]))).toEqual([]);
  });

  it("reports a missing note with the release and its refs", () => {
    const refs = [".changeset/a.md", ".changeset/b.md", ".changeset/c.md", ".changeset/d.md"];
    expect(
      checkReleaseNotes([{ version: "0.34.0", refs, pending: true }], new Map([[PAGE, NOTE]])),
    ).toEqual([
      "apps/docs/src/docs/customers/upgrading/0-34.mdx: missing: 0.34.0 (pending) carries a break (.changeset/a.md, .changeset/b.md, .changeset/c.md and 1 more); write its upgrade note with the sections What changes, Pins, Steps, Verify, Roll back (ADR 0013 decision 5)",
    ]);
    expect(
      checkReleaseNotes([{ version: "2.1.0", refs: ["abc1234"], pending: false }], new Map()),
    ).toEqual([
      "apps/docs/src/docs/customers/upgrading/2.mdx: missing: 2.1.0 carries a break (abc1234); write its upgrade note with the sections What changes, Pins, Steps, Verify, Roll back (ADR 0013 decision 5)",
    ]);
  });

  it("reports each missing section once per note", () => {
    const partial = NOTE.replace("## Verify\n", "").replace("## Roll back\n", "## Rollback\n");
    const releases = [
      { version: "0.33.0", refs: ["6186329"], pending: false },
      { version: "0.33.1", refs: ["d60f9d5"], pending: false },
    ];
    expect(checkReleaseNotes(releases, new Map([[PAGE, partial]]))).toEqual([
      `${PAGE}: no "## Verify" section (ADR 0013 decision 5)`,
      `${PAGE}: no "## Roll back" section (ADR 0013 decision 5)`,
    ]);
  });

  it("reports a breaking patch the note does not name, and not a longer version that contains it", () => {
    const unnamed = NOTE.replace("### 0.33.1", "### 0.33.10");
    expect(
      checkReleaseNotes(
        [{ version: "0.33.1", refs: ["d60f9d5"], pending: false }],
        new Map([[PAGE, unnamed]]),
      ),
    ).toEqual([
      `${PAGE}: does not name 0.33.1, which carries a break (d60f9d5); add what it changes`,
    ]);
    const major = "apps/docs/src/docs/customers/upgrading/1.mdx";
    expect(
      checkReleaseNotes(
        [{ version: "1.2.0", refs: ["abc1234"], pending: false }],
        new Map([[major, NOTE]]),
      ),
    ).toEqual([
      `${major}: does not name 1.2.0, which carries a break (abc1234); add what it changes`,
    ]);
  });
});
