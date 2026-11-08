/**
 * Stackra file contract:
 * Purpose: unit tests of `toolVersionOf`: the version `mise.toml` pins for a tool, as written and at the start of a
 *          line only; `undefined` when the file or the entry is missing.
 * Boundary: test only; writes `mise.toml` in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0019 (decision 3), ADR 0482; STA-1621.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { toolVersionOf } from "#node/functions/tool-version-of.function";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-mise-"));
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("toolVersionOf", () => {
  it("reads each tool's pin as written", () => {
    writeFileSync(
      join(repository, "mise.toml"),
      '[tools]\nnode = "24.22.0"\npnpm="12.1.0"\n# gitleaks = "1.0.0"\n',
    );

    expect(toolVersionOf(repository, "node")).toBe("24.22.0");
    expect(toolVersionOf(repository, "pnpm")).toBe("12.1.0");
    expect(toolVersionOf(repository, "gitleaks")).toBeUndefined();
  });

  it("answers undefined without a mise.toml", () => {
    expect(toolVersionOf(repository, "node")).toBeUndefined();
  });
});
