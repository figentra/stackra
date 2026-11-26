/**
 * Stackra file contract:
 * Purpose: tests of `staleReleaseClaims`: it refuses a claim that a version is unreleased or is the first (also when
 *          the claim wraps onto the next line), a dated status stamp, an "as of" date and a link to the old figentra
 *          GitHub path, accepts a page that says how to read the current version, and the committed customer pages
 *          and release runbook pass it.
 * Boundary: test only; the last case reads the real pages.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0013; STA-2847.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkReleaseFacts } from "../check-release-facts";
import { releaseFactPages } from "../release-fact-pages";
import { staleReleaseClaims } from "../stale-release-claims";

/** The reasons found on a one-page text. */
function reasons(text: string): string[] {
  return staleReleaseClaims("page.mdx", text).map((finding) => finding.reason);
}

describe("staleReleaseClaims", () => {
  it("refuses a claim that a version is not released, also when it wraps", () => {
    expect(reasons("No stable release yet: `0.1.0` is the first.")).toHaveLength(2);
    expect(
      staleReleaseClaims("p", "intro\nVersion `0.1.0` is not released\nyet, so latest is absent"),
    ).toEqual([
      {
        page: "p",
        line: 2,
        reason: "claims a release has not happened; say how to read the current version instead",
      },
    ]);
  });

  it("refuses dated stamps and snapshots", () => {
    expect(reasons("Status, 2026-10-29: the registry is built.")).toEqual([
      "a dated status stamp goes stale; state the fact without the date",
    ]);
    expect(reasons("every package (115, as of 2026-10-29)")).toEqual([
      "a dated snapshot goes stale; generate the figure or drop it",
    ]);
  });

  it("refuses links to the old GitHub path and accepts stackra-inc", () => {
    expect(reasons("[README](https://github.com/figentra/stackra/tree/main)")).toHaveLength(1);
    expect(reasons("[README](https://github.com/figentra/stackra-template#readme)")).toHaveLength(
      1,
    );
    expect(reasons("[README](https://github.com/stackra-inc/stackra/tree/main)")).toEqual([]);
    expect(
      reasons(
        "--certificate-identity-regexp '^https://github.com/(figentra|stackra-inc)/stackra/'",
      ),
    ).toEqual([]);
  });

  it("accepts a page that says how to read the current version", () => {
    expect(
      reasons(
        "Every release is under `latest`.\n\n```bash\nnpm view @stackra/container version --registry https://npm.stackra.figentra.com/\n```",
      ),
    ).toEqual([]);
  });
});

describe("the committed customer pages and release runbook", () => {
  it("covers every customer page and the release runbook", () => {
    expect(releaseFactPages()).toEqual(
      expect.arrayContaining([
        "customers/changelog.mdx",
        "customers/install.mdx",
        "customers/packages.mdx",
        "runbooks/release.mdx",
      ]),
    );
  });

  it("state no stale release fact", () => {
    expect(checkReleaseFacts()).toEqual([]);
  });
});
