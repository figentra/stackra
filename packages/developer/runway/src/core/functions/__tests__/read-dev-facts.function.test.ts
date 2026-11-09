/**
 * Stackra file contract:
 * Purpose: unit tests of `readDevFacts`: the nearest `.stackra/dev/ports.json` walking up from the working directory,
 *          parsed; `undefined` when no directory up to the root holds one; a file that is not JSON fails naming it.
 * Boundary: test only; writes a throwaway repository in the OS temp directory and points `process.cwd()` at it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1), ADR 0295 (decision 5).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { readDevFacts } from "#core/functions/read-dev-facts.function";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-dev-facts-"));
  mkdirSync(join(repository, "apps", "console"), { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(join(repository, "apps", "console"));
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(repository, { recursive: true, force: true });
});

/** Writes the dev facts file at `directory` of the throwaway repository. */
function writeDevFacts(directory: string, content: string): string {
  mkdirSync(join(directory, ".stackra", "dev"), { recursive: true });
  const file = join(directory, ".stackra", "dev", "ports.json");
  writeFileSync(file, content);
  return file;
}

describe("readDevFacts", () => {
  it("reads the nearest file walking up from the working directory", () => {
    writeDevFacts(repository, JSON.stringify({ version: 1, lane: 2, members: {} }));
    writeDevFacts(
      join(repository, "apps"),
      JSON.stringify({ version: 1, members: { console: { port: 5173 } } }),
    );

    const facts = readDevFacts();

    expect(facts?.lane).toBe(0);
    expect(facts?.members["console"]?.port).toBe(5173);
  });

  it("returns undefined when no directory up to the root holds the file", () => {
    expect(readDevFacts()).toBeUndefined();
  });

  it("fails naming the file when it is not JSON", () => {
    const file = writeDevFacts(repository, "{ not json");

    expect(() => readDevFacts()).toThrow(RunwayInvalidError);
    expect(() => readDevFacts()).toThrow(`${file} is invalid: (document): Not JSON:`);
  });
});
