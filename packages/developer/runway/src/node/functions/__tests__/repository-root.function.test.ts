/**
 * Stackra file contract:
 * Purpose: unit tests of `repositoryRoot`: the nearest directory walking up that holds `pnpm-workspace.yaml`, from
 *          the given folder or the working directory; none up to the file system root fails naming the start.
 * Boundary: test only; writes a throwaway repository in the OS temp directory and points `process.cwd()` at it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 2).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { repositoryRoot } from "#node/functions/repository-root.function";

let scratch: string;

beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), "stackra-runway-root-"));
  mkdirSync(join(scratch, "repo", "apps", "console", "src"), { recursive: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(scratch, { recursive: true, force: true });
});

describe("repositoryRoot", () => {
  it("finds the nearest workspace root above the given folder or the working directory", () => {
    const repository = join(scratch, "repo");
    writeFileSync(join(scratch, "pnpm-workspace.yaml"), "packages: []\n");
    writeFileSync(join(repository, "pnpm-workspace.yaml"), "packages: []\n");

    expect(repositoryRoot(join(repository, "apps", "console", "src"))).toBe(repository);
    vi.spyOn(process, "cwd").mockReturnValue(join(repository, "apps", "console"));
    expect(repositoryRoot()).toBe(repository);
  });

  it("fails when no directory up to the root holds pnpm-workspace.yaml", () => {
    const from = join(scratch, "repo", "apps", "console");

    expect(() => repositoryRoot(from)).toThrow(RunwayUnresolvedError);
    expect(() => repositoryRoot(from)).toThrow(`No repository root above ${from}`);
  });
});
