/**
 * Stackra file contract:
 * Purpose: unit tests of `SettingsApplyCommand` on the console: it records sandbox revisions through the member's
 *          runner with the author and reason, lists their ids and returns them under `--json`; an apply without an
 *          author or with a misspelt node exits 2 and applies nothing.
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

import { SettingsApplyCommand } from "#node/commands/settings-apply.command";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";

vi.mock("#node/functions/load-settings-runner.function", () => ({ loadSettingsRunner: vi.fn() }));

const settingsApply = vi.fn();
const PACK = "groups:\n  orders:\n    values:\n      acceptingOrders: false\n";
const SCOPE = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme_sandbox" };
const NODE = ["--scope-id", SCOPE.id, "--scope-path", SCOPE.path];
const AUTHOR = "usr_01j9z3k4m5n6p7q8r9s0t1v2w0";
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-settings-"));
  writeFileSync(join(root, "orders.yaml"), PACK);
  settingsApply.mockReset();
  vi.mocked(loadSettingsRunner).mockReset();
  vi.mocked(loadSettingsRunner).mockResolvedValue({ settingsDiff: vi.fn(), settingsApply });
  vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe("SettingsApplyCommand", () => {
  it("applies a pack with its author and reason and lists the revisions", async () => {
    settingsApply.mockResolvedValue({ revisions: ["rev_1"] });
    const argv = ["settings:apply", "orders.yaml", ...NODE, "--author", AUTHOR];
    const result = await runCommandForTest(
      [SettingsApplyCommand],
      [...argv, "--reason", "copy the demo store", "--env", "dev"],
      { cwd: root },
    );
    expect(result.exitCode).toBe(0);
    expect(settingsApply).toHaveBeenCalledWith({
      cwd: root,
      environment: "dev",
      scope: SCOPE,
      yaml: PACK,
      author: AUTHOR,
      reason: "copy the demo store",
    });
    expect(result.stdout).toContain("settings:apply platform.acme_sandbox (dev): 1 revision");
    expect(result.stdout).toContain("rev_1");
    const json = await runCommandForTest([SettingsApplyCommand], [...argv, "--json"], {
      cwd: root,
    });
    expect(json.json).toEqual({
      ok: true,
      data: { scope: SCOPE, environment: "dev", revisions: ["rev_1"] },
    });
  });

  it("refuses an apply without an author or with a misspelt node with exit 2", async () => {
    const anonymous = await runCommandForTest(
      [SettingsApplyCommand],
      ["settings:apply", "orders.yaml", ...NODE],
      { cwd: root },
    );
    expect(anonymous.exitCode).toBe(2);
    const misspelt = await runCommandForTest(
      [SettingsApplyCommand],
      ["settings:apply", "orders.yaml", "--scope-id", SCOPE.id, "--author", AUTHOR],
      { cwd: root },
    );
    expect(misspelt.exitCode).toBe(2);
    expect(settingsApply).not.toHaveBeenCalled();
  });
});
