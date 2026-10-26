/**
 * Stackra file contract:
 * Purpose: unit tests of `SETTINGS_DIFF_COMMAND` and `SETTINGS_APPLY_COMMAND`: diff hands the pack text and the node to
 *          the member's runner and prints each row; apply needs an author, records sandbox revisions through the
 *          runner and prints their ids; a missing pack or a misspelt node is a usage error.
 * Boundary: test only; a throwaway pack in the OS temp directory and a fake runner, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0213 (decision 4); ADR 0395 (decision 5).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SETTINGS_APPLY_COMMAND } from "#node/constants/settings-apply-command.constant";
import { SETTINGS_DIFF_COMMAND } from "#node/constants/settings-diff-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/load-settings-runner.function", () => ({ loadSettingsRunner: vi.fn() }));

const settingsDiff = vi.fn();
const settingsApply = vi.fn();
const PACK = "groups:\n  orders:\n    values:\n      acceptingOrders: false\n";
const NODE = {
  "scope-id": "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  "scope-path": "platform.acme_sandbox",
};
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-settings-"));
  writeFileSync(join(root, "orders.yaml"), PACK);
  settingsDiff.mockReset();
  settingsApply.mockReset();
  vi.mocked(loadSettingsRunner).mockReset();
  vi.mocked(loadSettingsRunner).mockResolvedValue({ settingsDiff, settingsApply });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const run = (
  command: CliCommand,
  positionals: readonly string[],
  values: CliContext["values"] = {},
) => {
  const { io, output } = captureIo();
  const code = command.run({ cwd: root, io, values, positionals, rest: [], cli: async () => 0 });
  return { code, output };
};

describe("settings commands", () => {
  it("diffs a pack at a node through the member's runner", async () => {
    settingsDiff.mockResolvedValue([
      {
        group: "orders",
        path: "acceptingOrders",
        before: true,
        after: false,
        lockedBefore: false,
        lockedAfter: true,
      },
    ]);
    const { code, output } = run(SETTINGS_DIFF_COMMAND, ["orders.yaml"], { ...NODE, env: "dev" });
    expect(await code).toBe(0);
    expect(settingsDiff).toHaveBeenCalledWith({
      cwd: root,
      environment: "dev",
      scope: { id: NODE["scope-id"], path: NODE["scope-path"] },
      yaml: PACK,
    });
    expect(output()).toContain("settings:diff platform.acme_sandbox (dev): 1 change");
    expect(output()).toContain("  orders.acceptingOrders: true -> false (locks)");
  });

  it("applies a pack with its author and prints the revisions", async () => {
    settingsApply.mockResolvedValue({ revisions: ["rev_1"] });
    const { code, output } = run(SETTINGS_APPLY_COMMAND, ["orders.yaml"], {
      ...NODE,
      author: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0",
      reason: "copy the demo store",
      env: "dev",
    });
    expect(await code).toBe(0);
    expect(settingsApply).toHaveBeenCalledWith(
      expect.objectContaining({
        author: "usr_01j9z3k4m5n6p7q8r9s0t1v2w0",
        reason: "copy the demo store",
        yaml: PACK,
      }),
    );
    expect(output()).toContain("  rev_1");
  });

  it("refuses a missing pack, a misspelt node and an apply without an author", async () => {
    await expect(run(SETTINGS_DIFF_COMMAND, [], NODE).code).rejects.toThrow(CliUsageError);
    await expect(
      run(SETTINGS_DIFF_COMMAND, ["orders.yaml"], { ...NODE, "scope-id": "acme" }).code,
    ).rejects.toThrow(CliUsageError);
    await expect(run(SETTINGS_APPLY_COMMAND, ["orders.yaml"], NODE).code).rejects.toThrow(
      CliUsageError,
    );
    expect(settingsApply).not.toHaveBeenCalled();
  });
});
