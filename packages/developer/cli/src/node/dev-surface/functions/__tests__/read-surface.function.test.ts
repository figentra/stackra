/**
 * Stackra file contract:
 * Purpose: unit tests of `readSurface`: a shell surface with its packages and the local gateway port, and the
 *          refusals (no runway, unknown surface, no shell, no packages).
 * Boundary: test only; writes a root runway into a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 6); app-shells section 8.2.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readSurface } from "#node/dev-surface/functions/read-surface.function";

const RUNWAY = `product:
  key: acme
surfaces:
  console:
    shell: os/console@3
    packages:
      - "@acme/console-ui"
  landing:
    content: assets/landing
  ops:
    contributes: "@acme/ops-ui"
  bare:
    shell: os/console@3
  site:
    shell: os/landing@1
    content: assets/landing
environments:
  dev:
    infra:
      gateway:
        port: 4000
`;

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-surface-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("readSurface", () => {
  it("reads the shell, the packages and the gateway port", () => {
    writeFileSync(join(root, "runway.yaml"), RUNWAY);
    expect(readSurface(root, "console")).toEqual({
      shell: { owner: "os", name: "console", line: 3 },
      packages: ["@acme/console-ui"],
      gatewayPort: 4000,
      product: "acme",
    });
  });

  it("reads a landing site of seed content only", () => {
    writeFileSync(join(root, "runway.yaml"), RUNWAY);
    expect(readSurface(root, "site")).toEqual({
      shell: { owner: "os", name: "landing", line: 1 },
      packages: [],
      gatewayPort: 4000,
      product: "acme",
      content: "assets/landing",
    });
  });

  it("refuses a missing runway, an unknown surface, a surface without shell or packages", () => {
    expect(() => readSurface(root, "console")).toThrow(/root runway/);
    writeFileSync(join(root, "runway.yaml"), RUNWAY);
    expect(() => readSurface(root, "till")).toThrow(/unknown surface: till/);
    expect(() => readSurface(root, "landing")).toThrow(/names no shell/);
    expect(() => readSurface(root, "ops")).toThrow(/names no shell/);
    expect(() => readSurface(root, "bare")).toThrow(/lists no packages/);
  });
});
