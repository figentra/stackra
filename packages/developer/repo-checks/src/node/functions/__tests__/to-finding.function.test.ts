/**
 * Stackra file contract:
 * Purpose: unit tests of `toFinding`: a text with `path:`, `path:line:` or none is located, a member-relative path is
 *          joined to its member directory, and the ADR the message names is carried.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { toFinding } from "#node/functions/to-finding.function";

describe("toFinding", () => {
  it("reads path and line from a repository-level text and the ADR from its message", () => {
    expect(
      toFinding("docs", {
        rule: "doc-standard",
        dir: "",
        text: "packages/x/src/a.ts:12: export a has no TSDoc block (ADR 0007)",
      }),
    ).toEqual({
      phase: "docs",
      tool: "repo-checks",
      rule: "doc-standard",
      path: "packages/x/src/a.ts",
      line: 12,
      column: null,
      message: "export a has no TSDoc block (ADR 0007)",
      severity: "error",
      fixable: false,
      adr: "0007",
    });
  });

  it("puts a text with no path on its member directory, or on the repository", () => {
    const member = toFinding("structure", {
      rule: "member",
      dir: "packages/x",
      text: 'turbo.jsonc does not extend "//"',
    });
    expect([member.path, member.line, member.message, member.adr]).toEqual([
      "packages/x",
      null,
      'turbo.jsonc does not extend "//"',
      null,
    ]);
    expect(
      toFinding("structure", { rule: "runway-schemas", dir: "", text: "a.json differs from b" })
        .path,
    ).toBe(".");
  });

  it("joins a member-relative path to the member and keeps one already under it", () => {
    expect(
      toFinding("structure", {
        rule: "service",
        dir: "services/notes",
        text: "src/encore.service.ts: services hold no Encore files (ADR 0124)",
      }).path,
    ).toBe("services/notes/src/encore.service.ts");
    expect(
      toFinding("structure", { rule: "x", dir: "apps/web", text: "apps/web/a.ts:3:7: bad" }),
    ).toMatchObject({ path: "apps/web/a.ts", line: 3, column: 7, message: "bad" });
  });
});
