/**
 * Stackra file contract:
 * Purpose: unit tests of `registryOrigin`: the flag wins, then `STACKRA_REGISTRY`, then the workspace `.npmrc`, then
 *          the ADR 0453 host; a value that is not a URL is a usage error.
 * Boundary: test only; writes a throwaway `.npmrc` and restores the environment.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 1 and 10).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { registryOrigin } from "#node/functions/registry-origin.function";

let root: string;
const saved = process.env["STACKRA_REGISTRY"];

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-registry-"));
  delete process.env["STACKRA_REGISTRY"];
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  if (saved === undefined) delete process.env["STACKRA_REGISTRY"];
  else process.env["STACKRA_REGISTRY"] = saved;
});

describe("registryOrigin", () => {
  it("defaults to the ADR 0453 host", () => {
    expect(registryOrigin(root, undefined)).toBe("https://npm.stackra.figentra.com/");
  });

  it("reads the workspace .npmrc, then the environment, then the flag", () => {
    writeFileSync(join(root, ".npmrc"), "@stackra:registry=https://npmrc.test\n");
    expect(registryOrigin(root, undefined)).toBe("https://npmrc.test/");
    process.env["STACKRA_REGISTRY"] = "https://env.test/";
    expect(registryOrigin(root, undefined)).toBe("https://env.test/");
    expect(registryOrigin(root, "http://localhost:8787")).toBe("http://localhost:8787/");
  });

  it("refuses a value that is not a URL", () => {
    expect(() => registryOrigin(root, "not a url")).toThrow(CliUsageError);
  });
});
