/**
 * Stackra file contract:
 * Purpose: unit tests of `openEncoreMcp`: `null` without a root runway, without an Encore app in its providers, and,
 *          with one line on standard error, when the Encore CLI cannot start.
 * Boundary: test only; writes a throwaway runway in the OS temp directory and empties PATH so no real `encore` runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); R-29.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { openEncoreMcp } from "#node/functions/open-encore-mcp.function";

let root: string;
let path: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-mcp-"));
  path = process.env["PATH"];
});

afterEach(() => {
  process.env["PATH"] = path;
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

/** Writes a root runway with the given provider lines. */
function rootRunway(...providers: string[]): void {
  writeFileSync(
    join(root, "runway.yaml"),
    ["version: 3", "project: acme", "environments: {}", ...providers, ""].join("\n"),
  );
}

describe("openEncoreMcp", () => {
  it("is null without a root runway or an Encore app", async () => {
    await expect(openEncoreMcp(root, "1.0.0")).resolves.toBeNull();

    rootRunway("providers:", "  github:", "    org: acme");
    await expect(openEncoreMcp(root, "1.0.0")).resolves.toBeNull();
  });

  it("is null, saying why, when the Encore CLI cannot start", async () => {
    rootRunway("providers:", "  encore:", "    app: acme-platform");
    process.env["PATH"] = root;
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await expect(openEncoreMcp(root, "1.0.0")).resolves.toBeNull();
    expect(String(stderr.mock.calls[0]?.[0])).toContain("the local Encore tools are unavailable");
  });
});
