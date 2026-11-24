/**
 * Stackra file contract:
 * Purpose: unit tests of `jscpdBinary`: the workspace's own jscpd binary is returned when it is installed, and a
 *          repository without it gets a refusal that names the dependency to add, not a bare "jscpd ENOENT".
 * Boundary: test only; temp directories.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { jscpdBinary } from "#node/duplication/functions/jscpd-binary.function";

describe("jscpdBinary", () => {
  it("returns the binary the workspace installed", () => {
    const root = mkdtempSync(join(tmpdir(), "jscpd-binary-"));
    mkdirSync(join(root, "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(root, "node_modules", ".bin", "jscpd"), "#!/bin/sh\n");
    expect(jscpdBinary(root)).toBe(join(root, "node_modules", ".bin", "jscpd"));
  });

  it("refuses a workspace without it, naming the dependency to add", () => {
    const root = mkdtempSync(join(tmpdir(), "jscpd-binary-"));
    expect(() => jscpdBinary(root)).toThrow(
      /needs jscpd, which is not installed in .*: add `jscpd`/,
    );
    expect(() => jscpdBinary(root)).not.toThrow(/ENOENT/);
  });
});
