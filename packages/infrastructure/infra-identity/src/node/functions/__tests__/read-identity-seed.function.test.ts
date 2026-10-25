/**
 * Stackra file contract:
 * Purpose: unit tests of `readIdentitySeed`: a block-style seed file is read, parsed as YAML and checked; a missing
 *          file, YAML with a duplicate key and a document that breaks the seed format each fail as
 *          `IdentityInfraInvalidError` naming the file.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 3).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { IdentityInfraInvalidError } from "#core/errors/identity-infra-invalid.error";
import { readIdentitySeed } from "#node/functions/read-identity-seed.function";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "stackra-identity-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** Writes `seed.yaml` with the given lines and returns its path. */
function seedFile(...lines: string[]): string {
  const file = join(directory, "seed.yaml");
  writeFileSync(file, `${lines.join("\n")}\n`);
  return file;
}

describe("readIdentitySeed", () => {
  it("reads and checks a seed", () => {
    const file = seedFile(
      "version: 1",
      "org:",
      "  name: Acme staff",
      "project:",
      "  name: acme-platform",
      "apps:",
      "  console:",
      "    kind: bff",
      "    redirectUris:",
      "      staging:",
      "        - https://console.staging.acme.example/api/auth/callback",
    );

    const seed = readIdentitySeed(file);
    expect(seed.org.name).toBe("Acme staff");
    expect(seed.apps["console"]?.redirectUris.staging).toEqual([
      "https://console.staging.acme.example/api/auth/callback",
    ]);
  });

  it("fails on a missing file, naming it", () => {
    const file = join(directory, "missing.yaml");

    expect(() => readIdentitySeed(file)).toThrow(IdentityInfraInvalidError);
    expect(() => readIdentitySeed(file)).toThrow(file);
  });

  it("fails on a duplicate key", () => {
    const file = seedFile("version: 1", "version: 1");

    expect(() => readIdentitySeed(file)).toThrow(/Not readable as YAML/);
  });

  it("fails on a document that breaks the seed format, naming the file", () => {
    const file = seedFile("version: 2");

    expect(() => readIdentitySeed(file)).toThrow(`${file} is invalid`);
  });
});
