/**
 * Stackra file contract:
 * Purpose: unit tests of `releaseNoteFindings` over a temporary repository: a breaking release without its note is a
 *          `release-notes` finding, its note clears it, a pending break-marked changeset needs the next release's note,
 *          and a product repository (no `@stackra/*` changelog) has none.
 * Boundary: test only; writes a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0013 (decision 5); STA-2835; ADR 0022 (test placement).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { releaseNoteFindings } from "#node/functions/release-note-findings.function";

/** A temporary repository holding `files` (path to text). */
function repo(files: Record<string, string>): { root: string; files: string[] } {
  const root = mkdtempSync(join(tmpdir(), "release-notes-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return { root, files: Object.keys(files) };
}

const CHANGELOG = {
  "packages/a/CHANGELOG.md":
    "# @stackra/a\n\n## 0.32.0\n\n### Minor Changes\n\n- 9ddce28: Bump step for a service that injects `Signer`: bind `kms`.\n",
};
const PAGE = "apps/docs/src/docs/customers/upgrading/0-32.mdx";
const NOTE = "## What changes\n\n## Pins\n\n## Steps\n\n## Verify\n\n## Roll back\n";

describe("releaseNoteFindings", () => {
  it("reports a breaking release without its note, and nothing once the note is there", () => {
    expect(releaseNoteFindings(repo(CHANGELOG))).toEqual([
      {
        rule: "release-notes",
        dir: "",
        text: `${PAGE}: missing: 0.32.0 carries a break (9ddce28); write its upgrade note with the sections What changes, Pins, Steps, Verify, Roll back (ADR 0013 decision 5)`,
      },
    ]);
    expect(releaseNoteFindings(repo({ ...CHANGELOG, [PAGE]: NOTE }))).toEqual([]);
  });

  it("holds a pending break-marked changeset to the next release's note; README.md is not a changeset", () => {
    const context = repo({
      ...CHANGELOG,
      [PAGE]: NOTE,
      ".changeset/README.md": "Breaking: not a changeset.\n",
      ".changeset/drop-x.md": '---\n"@stackra/a": minor\n---\n\nBreaking: `x` is removed.\n',
    });
    expect(releaseNoteFindings(context).map((finding) => finding.text)).toEqual([
      "apps/docs/src/docs/customers/upgrading/0-33.mdx: missing: 0.33.0 (pending) carries a break (.changeset/drop-x.md); write its upgrade note with the sections What changes, Pins, Steps, Verify, Roll back (ADR 0013 decision 5)",
    ]);
  });

  it("reports nothing in a product repository", () => {
    const product = repo({
      "CHANGELOG.md":
        "# @acme/app\n\n## 2.0.0\n\n### Major Changes\n\n- 5555555: Breaking: new API.\n",
    });
    expect(releaseNoteFindings(product)).toEqual([]);
  });
});
