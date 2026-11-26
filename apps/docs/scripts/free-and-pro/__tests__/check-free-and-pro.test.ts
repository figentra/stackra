/**
 * Stackra file contract:
 * Purpose: tests of the "Free and Pro" page check: the committed page passes against this repository; on a stand-in
 *          repository a page that names a private or missing package, or leaves out a Pro package, fails; and
 *          `publishedPackages` lists only the non-private packages.
 * Boundary: test only; the stand-in repository is written to a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0461 (decisions 1 and 2); STA-2865.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { checkFreeAndPro } from "../check-free-and-pro";
import { FREE_AND_PRO_PAGE } from "../free-and-pro-page";
import { PRO_PACKAGES } from "../pro-packages";
import { publishedPackages } from "../published-packages";

/** A stand-in repository with the given packages and page text. */
function standIn(
  packages: Record<string, { name: string; private?: boolean }>,
  page: string,
): string {
  const root = mkdtempSync(join(tmpdir(), "free-and-pro-"));
  for (const [path, manifest] of Object.entries(packages)) {
    mkdirSync(join(root, "packages", path), { recursive: true });
    writeFileSync(join(root, "packages", path, "package.json"), JSON.stringify(manifest));
  }
  mkdirSync(join(root, "packages", "data", "no-manifest"), { recursive: true });
  mkdirSync(dirname(join(root, FREE_AND_PRO_PAGE)), { recursive: true });
  writeFileSync(join(root, FREE_AND_PRO_PAGE), page);
  return root;
}

/** Every Pro package in inline code, one per line. */
const WHOLE_PRO_LIST = PRO_PACKAGES.map((name) => `\`${name}\``).join("\n");

describe("checkFreeAndPro", () => {
  it("passes the committed page against this repository", () => {
    expect(checkFreeAndPro()).toEqual([]);
  });

  it("fails a page that names a private or missing package", () => {
    const root = standIn(
      {
        "application/ai": { name: "@stackra/ai" },
        "developer/internal": { name: "@stackra/internal", private: true },
      },
      `\`@stackra/ai\` \`@stackra/internal\` \`@stackra/missing\`\n${WHOLE_PRO_LIST}`,
    );
    expect(checkFreeAndPro(root)).toEqual([
      { line: 1, reason: "names @stackra/internal, which is not a published @stackra package" },
      { line: 1, reason: "names @stackra/missing, which is not a published @stackra package" },
    ]);
  });

  it("fails a page that leaves out a Pro package", () => {
    const root = standIn({ "application/ai": { name: "@stackra/ai" } }, "`@stackra/ai`");
    expect(checkFreeAndPro(root).map(({ reason }) => reason)).toEqual(
      PRO_PACKAGES.map((name) => `leaves out ${name}, which ADR 0461 puts on sale`),
    );
  });
});

describe("publishedPackages", () => {
  it("lists the non-private packages only", () => {
    const root = standIn(
      {
        "application/ai": { name: "@stackra/ai" },
        "developer/internal": { name: "@stackra/internal", private: true },
      },
      "",
    );
    expect([...publishedPackages(join(root, "packages"))]).toEqual(["@stackra/ai"]);
  });
});
