/**
 * Stackra file contract:
 * Purpose: unit tests of `STACKRA_MANIFEST_SCHEMA`: a missing kind is `package`, every kind parses, `mcp` needs its
 *          server entry, and an unknown kind is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 7 and 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { STACKRA_MANIFEST_SCHEMA } from "#contracts/constants/stackra-manifest-schema.constant";

describe("STACKRA_MANIFEST_SCHEMA", () => {
  it("reads a missing kind as package", () => {
    expect(STACKRA_MANIFEST_SCHEMA.parse({})).toEqual({ kind: "package" });
  });

  it("parses each kind", () => {
    for (const kind of ["package", "skill", "agent", "plugin"]) {
      expect(STACKRA_MANIFEST_SCHEMA.parse({ kind })).toEqual({ kind });
    }
    expect(STACKRA_MANIFEST_SCHEMA.parse({ kind: "mcp", mcp: { command: "npx" } })).toEqual({
      kind: "mcp",
      mcp: { command: "npx" },
    });
  });

  it("refuses an mcp item without its entry and an unknown kind", () => {
    expect(STACKRA_MANIFEST_SCHEMA.safeParse({ kind: "mcp" }).success).toBe(false);
    expect(STACKRA_MANIFEST_SCHEMA.safeParse({ kind: "theme" }).success).toBe(false);
  });
});
