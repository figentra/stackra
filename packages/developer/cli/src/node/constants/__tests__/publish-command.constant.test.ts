/**
 * Stackra file contract:
 * Purpose: unit tests of `PUBLISH_COMMAND`: a member `checkItemPackage` refuses exits 1 with every problem and never
 *          starts `pnpm publish`.
 * Boundary: test only; writes a throwaway member in the OS temp directory. The publish itself runs in the release
 *           workflow, not here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 7 and 11).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { PUBLISH_COMMAND } from "#node/constants/publish-command.constant";
import { captureIo } from "#node/functions/capture-io.function";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "stackra-publish-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("PUBLISH_COMMAND", () => {
  it("refuses a misnamed skill with every problem", async () => {
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "@acme/archify", stackra: { kind: "skill" } }),
    );
    const { io, output } = captureIo();
    const code = await PUBLISH_COMMAND.run({
      cwd: dir,
      io,
      values: { "dry-run": true },
      positionals: [],
      rest: [],
      cli: async () => 0,
    });
    expect(code).toBe(1);
    expect(output()).toContain("@acme/archify is not in @stackra or @stackra-pro");
    expect(output()).toContain("a skill item must be named @<scope>/skill-<name>");
    expect(output()).toContain("a skill item needs SKILL.md at its root");
  });
});
