/**
 * Stackra file contract:
 * Purpose: unit tests of `checkRepositoryLayout`: a repository that matches its template passes; a root src/, a script
 *          folder, an undeclared apps/ or extra entry, a tools/ without README, a missing required entry, an unknown
 *          preset and a path with the retired Flow name are each one finding; declarations and members pass.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0526; ADR 0528; ADR 0529 (decision 5); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkRepositoryLayout } from "#node/functions/check-repository-layout.function";
import type { LayoutInput } from "#node/types/layout-input.type";

/** A stackra-preset repository with one services/ member and nothing extra. */
const BASE: LayoutInput = {
  entries: ["AGENTS.md", "README.md", "docs", "flow.config.json", "package.json", "services"],
  paths: ["services/example/package.json"],
  preset: "stackra",
  members: ["services"],
  allow: {},
  toolsReadme: false,
};

describe("checkRepositoryLayout", () => {
  /** The baseline: template entries plus a member folder. */
  it("accepts a repository that matches its template", () => {
    expect(checkRepositoryLayout(BASE)).toEqual([]);
  });

  /** Each broken rule is one finding naming its ADR decision. */
  it("refuses root src, script folders, undeclared apps and extra entries", () => {
    const findings = checkRepositoryLayout({
      ...BASE,
      entries: [...BASE.entries, "src", "scripts", "bin", "apps", "misc"],
    });
    expect(findings).toHaveLength(5);
    expect(findings.join("\n")).toMatch(/src\/: no root src/);
    expect(findings.join("\n")).toMatch(/apps\/: only where an app is the product/);
  });

  /** A declaration with a reason allows an entry, but never a script folder. */
  it("lets a declaration allow apps and extras, not scripts", () => {
    const allow = {
      apps: "the product's published docs site",
      misc: "kept for a reason",
      scripts: "no",
    };
    const entries = [...BASE.entries, "apps", "misc", "scripts"];
    expect(checkRepositoryLayout({ ...BASE, entries, allow })).toHaveLength(1);
  });

  /** tools/ is allowed only with its README. */
  it("needs tools/README.md", () => {
    const entries = [...BASE.entries, "tools"];
    expect(checkRepositoryLayout({ ...BASE, entries })).toHaveLength(1);
    expect(checkRepositoryLayout({ ...BASE, entries, toolsReadme: true })).toEqual([]);
  });

  /** The required entries and the preset come from the template. */
  it("reports a missing docs/ and an unknown preset", () => {
    const entries = BASE.entries.filter((name) => name !== "docs");
    expect(checkRepositoryLayout({ ...BASE, entries })).toHaveLength(1);
    expect(checkRepositoryLayout({ ...BASE, preset: "other" })).toHaveLength(1);
  });

  /** The retired name is refused outside the ADR registers. */
  it("refuses figentra-flow in a path except in ADR history", () => {
    const paths = [
      "packages/figentra-flow/package.json",
      "apps/docs/src/docs/adr/0503-figentra-flow.mdx",
    ];
    expect(checkRepositoryLayout({ ...BASE, paths })).toHaveLength(1);
  });
});
