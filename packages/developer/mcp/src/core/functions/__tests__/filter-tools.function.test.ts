/**
 * Stackra file contract:
 * Purpose: unit tests of `filterTools`: a tool without the caller's permission for their roles and record dropped, a
 *          tool the matrix sets to off for that role and record dropped, a tool outside the tenant's entitlements
 *          listed with the `locked` marker, the rest kept in order.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0155 (decisions 3 and 4); R3-SO-02; J2-6.
 */
import { describe, expect, it } from "@stackra/testing";

import { filterTools } from "#core/functions/filter-tools.function";
import type { HostedTool } from "#core/types/hosted-tool.type";
import type { ToolScope } from "#core/types/tool-scope.type";

/** A tool row with only what the filter reads varying. */
function tool(name: string, permission: string): HostedTool {
  return {
    name,
    inputSchema: { type: "object" },
    annotations: {},
    action: `${name}@1`,
    member: "commerce",
    permission,
    risk: "L1",
    effects: [],
  };
}

describe("filterTools", () => {
  it("drops what the caller cannot do and marks what the tenant has not bought", () => {
    const table = [tool("a", "p.read"), tool("b", "p.write"), tool("c", "p.read")];
    const result = filterTools(table, {
      can: (permission) => permission === "p.read",
      isEntitled: (candidate) => candidate.name !== "c",
    });
    expect(result.tools.map(({ name, locked }) => ({ name, locked }))).toEqual([
      { name: "a", locked: false },
      { name: "c", locked: true },
    ]);
  });

  it("answers per role and record, and drops a tool the matrix sets to off there", () => {
    const table = [
      tool("draft_letter", "legal.letter.draft"),
      tool("file_claim", "legal.claim.file"),
    ];
    const seen: ToolScope[] = [];
    const matter: ToolScope = { roles: ["associate"], record: { kind: "matter", id: "mtr_1" } };
    const result = filterTools(
      table,
      {
        can: (_permission, scope) => {
          seen.push(scope);
          return scope.roles.includes("associate");
        },
        isOff: (candidate, scope) =>
          candidate.name === "file_claim" && scope.record?.kind === "matter",
        isEntitled: () => true,
      },
      matter,
    );
    expect(result.tools.map(({ name }) => name)).toEqual(["draft_letter"]);
    expect(seen).toEqual([matter, matter]);
    expect(
      filterTools(table, { can: (_p, scope) => scope.roles.length > 0, isEntitled: () => true })
        .tools,
    ).toEqual([]);
  });
});
