/**
 * Stackra file contract:
 * Purpose: unit tests of `checkToolPins`: a mise npm pin that a catalog pins at the same version passes; a different
 *          version or a package no catalog pins is one finding each; no npm pin means nothing to check.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: STA-1865; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkToolPins } from "#node/functions/check-tool-pins.function";

const WORKSPACE = [
  "catalog:",
  '  "@types/node": 26.6.4',
  "catalogs:",
  "  quality:",
  "    oxlint: 1.86.0",
  "    oxfmt: 0.71.0",
  "",
].join("\n");

describe("checkToolPins", () => {
  it("passes mise npm pins that a catalog pins at the same version", () => {
    const mise = '[tools]\nnode = "24.22.0"\n"npm:oxlint" = "1.86.0"\n"npm:oxfmt" = "0.71.0"\n';
    expect(checkToolPins(mise, WORKSPACE)).toEqual([]);
  });

  it("reports a different version and a package no catalog pins", () => {
    const mise = '[tools]\n"npm:oxlint" = "1.85.0"\n"npm:knip" = "6.0.0"\n';
    const findings = checkToolPins(mise, WORKSPACE);
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain("oxlint 1.85.0");
    expect(findings[1]).toContain("no pnpm-workspace.yaml catalog pins knip");
  });

  it("checks nothing without an npm pin", () => {
    expect(checkToolPins('[tools]\nnode = "24.22.0"\n', WORKSPACE)).toEqual([]);
    expect(checkToolPins(undefined, undefined)).toEqual([]);
  });
});
