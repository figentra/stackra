/**
 * Stackra file contract:
 * Purpose: unit tests of `environmentApiOrigin`: the origin is the edge's API host under the environment's zone, `api`
 *          when the runway names no host; a missing runway, environment or zone is a usage error naming `--api`.
 * Boundary: test only; a runway file in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0237; STA-1586.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { environmentApiOrigin } from "#node/functions/environment-api-origin.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-origin-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe(environmentApiOrigin, () => {
  it("joins the edge's API host and the environment's zone", () => {
    writeFileSync(
      join(root, "runway.yaml"),
      "environments:\n  production:\n    domains:\n      zone: acme.example\nedge:\n  apiHost: gw\n",
    );
    expect(environmentApiOrigin(root, "production")).toBe("https://gw.acme.example");
  });

  it("uses api when the runway names no host", () => {
    writeFileSync(
      join(root, "runway.yaml"),
      "environments:\n  staging:\n    domains:\n      zone: staging.acme.example\n",
    );
    expect(environmentApiOrigin(root, "staging")).toBe("https://api.staging.acme.example");
  });

  it("refuses a missing runway, environment or zone", () => {
    expect(() => environmentApiOrigin(root, "production")).toThrow(CliUsageError);
    writeFileSync(join(root, "runway.yaml"), "environments:\n  staging:\n    domains: {}\n");
    expect(() => environmentApiOrigin(root, "staging")).toThrow(/--api/u);
    expect(() => environmentApiOrigin(root, "production")).toThrow(CliUsageError);
  });
});
