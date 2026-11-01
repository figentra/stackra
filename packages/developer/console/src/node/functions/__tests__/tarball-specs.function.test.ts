/**
 * Stackra file contract:
 * Purpose: proves `tarballSpecs` maps packed `@stackra/*` tarballs to `file:` specs and ignores other files.
 * Boundary: unit test on a temporary folder.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-029; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-029
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { tarballSpecs } from "#node/functions/tarball-specs.function";

describe("tarballSpecs", () => {
  it("maps each stackra tarball to its package", () => {
    const folder = mkdtempSync(join(tmpdir(), "sta-1730-"));
    for (const file of [
      "stackra-console-0.0.0.tgz",
      "stackra-state-machine-0.2.0.tgz",
      "notes.txt",
    ])
      writeFileSync(join(folder, file), "");
    expect(tarballSpecs(folder)).toEqual({
      "@stackra/console": `file:${join(folder, "stackra-console-0.0.0.tgz")}`,
      "@stackra/state-machine": `file:${join(folder, "stackra-state-machine-0.2.0.tgz")}`,
    });
  });
});
