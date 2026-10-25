/**
 * Stackra file contract:
 * Purpose: unit tests of `readRunway`: a block-style runway file is read, parsed as YAML and checked for its kind; a
 *          missing file, YAML with a duplicate key and a document that breaks the schema each fail as
 *          `RunwayInvalidError` naming the file.
 * Boundary: test only; writes throwaway files in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1, 2 and 6).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { readRunway } from "#node/functions/read-runway.function";

let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "stackra-runway-"));
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

/** Writes `runway.yaml` with the given lines and returns its path. */
function runwayFile(...lines: string[]): string {
  const file = join(directory, "runway.yaml");
  writeFileSync(file, `${lines.join("\n")}\n`);
  return file;
}

describe("readRunway", () => {
  it("reads and checks a service runway", () => {
    const file = runwayFile(
      '$schema: "@stackra/runway/schema/service.json"',
      "version: 3",
      "secrets: [RESEND_API_KEY, WEB_PUSH_VAPID_PRIVATE_KEY]",
      "environments:",
      "  dev:",
      "    port: 4002",
      "    config:",
      "      notifications.delivery:",
      "        transport: memory",
    );

    const runway = readRunway(file, "service");
    expect(runway.secrets).toEqual(["RESEND_API_KEY", "WEB_PUSH_VAPID_PRIVATE_KEY"]);
    expect(runway.environments.dev?.config?.["notifications.delivery"]).toEqual({
      transport: "memory",
    });
  });

  it("fails naming the file when it is missing, not YAML or invalid", () => {
    expect(() => readRunway(join(directory, "absent.yaml"), "app")).toThrow(RunwayInvalidError);

    const duplicate = runwayFile("version: 3", "version: 3", "environments: {}");
    expect(() => readRunway(duplicate, "app")).toThrow(/Not readable as YAML/);

    const invalid = runwayFile("version: 3", "member: console", "environments: {}");
    let caught: unknown;
    try {
      readRunway(invalid, "app");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RunwayInvalidError);
    expect((caught as RunwayInvalidError).source).toBe(invalid);
  });
});
