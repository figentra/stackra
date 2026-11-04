/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsDiffCommand` on the console: it hands the pack text and the node to the member's
 *          runner, draws each row with its lock change and returns the rows under `--json`; a missing pack or a
 *          misspelt node exits 2 and loads no runner.
 * Boundary: test only; a throwaway pack in the OS temp directory and a fake runner, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0213 (decision 4); ADR 0395 (decision 5); ADR 0506; STA-1966.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SettingsDiffCommand } from "#node/commands/settings-diff.command";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";

vi.mock("#node/functions/load-settings-runner.function", () => ({ loadSettingsRunner: vi.fn() }));

const settingsDiff = vi.fn();
const PACK = "groups:\n  orders:\n    values:\n      acceptingOrders: false\n";
const SCOPE = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme_sandbox" };
const NODE = ["--scope-id", SCOPE.id, "--scope-path", SCOPE.path];
const ROW = {
  group: "orders",
  path: "acceptingOrders",
  before: true,
  after: false,
  lockedBefore: false,
  lockedAfter: true,
};
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-settings-"));
  writeFileSync(join(root, "orders.yaml"), PACK);
  settingsDiff.mockReset();
  vi.mocked(loadSettingsRunner).mockReset();
  vi.mocked(loadSettingsRunner).mockResolvedValue({ settingsDiff, settingsApply: vi.fn() });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("SettingsDiffCommand", () => {
  it("diffs a pack at a node through the member's runner and draws each row", async () => {
    settingsDiff.mockResolvedValue([ROW]);
    const result = await runCommandForTest(
      [SettingsDiffCommand],
      ["settings:diff", "orders.yaml", ...NODE, "--env", "dev"],
      { cwd: root, columns: 120 },
    );
    expect(result.exitCode).toBe(0);
    expect(settingsDiff).toHaveBeenCalledWith({
      cwd: root,
      environment: "dev",
      scope: SCOPE,
      yaml: PACK,
    });
    expect(result.stdout).toContain("settings:diff platform.acme_sandbox (dev): 1 change");
    expect(result.stdout).toContain("orders.acceptingOrders");
    expect(result.stdout).toContain("locks");
  });

  it("returns the node, the environment and the rows under --json", async () => {
    settingsDiff.mockResolvedValue([ROW]);
    const result = await runCommandForTest(
      [SettingsDiffCommand],
      ["settings:diff", "orders.yaml", ...NODE, "--env", "dev", "--json"],
      { cwd: root },
    );
    expect(result.json).toEqual({
      ok: true,
      data: { scope: SCOPE, environment: "dev", changes: [ROW] },
    });
  });

  it("refuses a missing pack and a misspelt node with exit 2", async () => {
    const missing = await runCommandForTest([SettingsDiffCommand], ["settings:diff", ...NODE], {
      cwd: root,
    });
    expect(missing.exitCode).toBe(2);
    const misspelt = await runCommandForTest(
      [SettingsDiffCommand],
      ["settings:diff", "orders.yaml", "--scope-id", "acme", "--scope-path", SCOPE.path],
      { cwd: root },
    );
    expect(misspelt.exitCode).toBe(2);
    expect(loadSettingsRunner).not.toHaveBeenCalled();
  });
});
