/**
 * Stackra file contract:
 * Purpose: unit tests of the facts reader behind the `.` readers: the injected `__STACKRA_RUNWAY__` document wins over
 *          any file; otherwise the nearest `.stackra/dev/ports.json` walking up from the working directory is read
 *          with defaults applied; no facts, a file that is not JSON and facts that break the schema each fail with a
 *          clear error.
 * Boundary: test only; writes a throwaway repository in the OS temp directory and points `process.cwd()` at it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); ADR 0295 (decision 5).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { runwayFacts } from "#core/functions/runway-facts.function";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-"));
  mkdirSync(join(repository, "apps", "console"), { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(join(repository, "apps", "console"));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  rmSync(repository, { recursive: true, force: true });
});

/** Writes the dev facts file of the throwaway repository. */
function writeDevFacts(content: string): void {
  mkdirSync(join(repository, ".stackra", "dev"), { recursive: true });
  writeFileSync(join(repository, ".stackra", "dev", "ports.json"), content);
}

describe("runwayFacts", () => {
  it("reads the nearest dev facts file and applies the defaults", () => {
    writeDevFacts(
      JSON.stringify({
        version: 1,
        lane: 1,
        members: { console: { url: "http://localhost:5273", port: 5273, host: "localhost" } },
      }),
    );

    expect(runwayFacts()).toEqual({
      version: 1,
      environment: "dev",
      lane: 1,
      infra: {},
      members: {
        console: {
          url: "http://localhost:5273",
          port: 5273,
          host: "localhost",
          https: false,
          open: false,
          desktop: {},
        },
      },
    });
  });

  it("prefers the injected facts over the file", () => {
    writeDevFacts(JSON.stringify({ version: 1, members: {} }));
    vi.stubGlobal("__STACKRA_RUNWAY__", {
      version: 1,
      environment: "production",
      feedOrigin: "https://downloads.acme.example",
      members: { console: { feed: { path: "console", channel: "latest" } } },
    });

    expect(runwayFacts().environment).toBe("production");
    expect(runwayFacts().members["console"]?.feed).toEqual({ path: "console", channel: "latest" });
  });

  it("fails when there are no facts", () => {
    expect(() => runwayFacts()).toThrow(RunwayUnresolvedError);
    expect(() => runwayFacts()).toThrow(/run `stackra dev`/);
  });

  it("fails on a file that is not JSON or breaks the schema", () => {
    writeDevFacts("{ not json");
    expect(() => runwayFacts()).toThrow(RunwayInvalidError);

    writeDevFacts(JSON.stringify({ version: 2 }));
    expect(() => runwayFacts()).toThrow(/version/);
  });
});
