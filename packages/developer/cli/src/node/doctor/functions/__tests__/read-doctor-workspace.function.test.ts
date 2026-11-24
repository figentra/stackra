/**
 * Stackra file contract:
 * Purpose: unit tests of `readDoctorWorkspace`: the root's scripts and runway, the manifests of the root and every member, and each
 *          member's `environments.dev.port`; a folder inside the workspace narrows it to the members at or under that folder and
 *          drops the root; a missing workspace file means no members, and an unreadable or non-numeric port is skipped.
 * Boundary: test only; a throwaway workspace under the OS temp folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec User Story 0.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readDoctorWorkspace } from "#node/doctor/functions/read-doctor-workspace.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-doctor-ws-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const write = (files: Record<string, string>): void => {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
};

const runway = (port: unknown): string => `environments:\n  dev:\n    port: ${String(port)}\n`;

/** A workspace of one app and two services. */
const workspace = (): void =>
  write({
    "pnpm-workspace.yaml": "packages:\n  - apps/*\n  - services/*\n",
    "package.json": JSON.stringify({
      name: "acme",
      scripts: { dev: "stackra dev", "agents:check": "x" },
    }),
    "runway.yaml": "providers:\n  aws: {}\n",
    "apps/console/package.json": JSON.stringify({ name: "@acme/console" }),
    "apps/console/runway.yaml": runway(3710),
    "services/orders/package.json": JSON.stringify({ name: "@acme/orders" }),
    "services/orders/runway.yaml": runway(3720),
    "services/billing/package.json": JSON.stringify({ name: "@acme/billing" }),
    "services/billing/runway.yaml": runway('"not a port"'),
  });

describe("readDoctorWorkspace", () => {
  it("reads the root's scripts and runway, every manifest and the numeric dev ports", () => {
    workspace();
    const result = readDoctorWorkspace(root);
    expect(result.scripts).toEqual({ dev: "stackra dev", "agents:check": "x" });
    expect(result.runway).toEqual({ providers: { aws: {} } });
    expect(result.manifests.map((m) => (m as { name: string }).name).sort()).toEqual([
      "@acme/billing",
      "@acme/console",
      "@acme/orders",
      "acme",
    ]);
    expect([...result.devPorts].sort()).toEqual([3710, 3720]);
  });

  it("narrows to the members under a folder and drops the root", () => {
    workspace();
    const result = readDoctorWorkspace(root, join(root, "services"));
    expect(result.manifests.map((m) => (m as { name: string }).name).sort()).toEqual([
      "@acme/billing",
      "@acme/orders",
    ]);
    expect(result.devPorts).toEqual([3720]);
    const one = readDoctorWorkspace(root, join(root, "services", "orders"));
    expect(one.manifests.map((m) => (m as { name: string }).name)).toEqual(["@acme/orders"]);
  });

  it("has no members without a pnpm-workspace.yaml, and no scripts without a package.json", () => {
    write({ "apps/console/package.json": "{}", "apps/console/runway.yaml": runway(3710) });
    const result = readDoctorWorkspace(root);
    expect(result.devPorts).toEqual([]);
    expect(result.scripts).toEqual({});
    expect(result.manifests).toEqual([{}]);
    expect(result.runway).toBeUndefined();
  });

  it("skips a runway.yaml that does not parse", () => {
    write({
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
      "package.json": "{}",
      "apps/console/package.json": "{}",
      "apps/console/runway.yaml": "environments: [unclosed",
      "runway.yaml": "a: [b",
    });
    const result = readDoctorWorkspace(root);
    expect(result.devPorts).toEqual([]);
    expect(result.runway).toBeUndefined();
  });
});
