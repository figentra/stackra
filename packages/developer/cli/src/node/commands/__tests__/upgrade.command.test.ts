/**
 * Stackra file contract:
 * Purpose: unit tests of `UpgradeCommand` on the console over a throwaway consumer workspace on 0.8.2/0.29.0: the
 *          upgrade moves every pin, renames identity's `DeviceSession` in the source (never in `node_modules` or gen's
 *          `.stackra/`), reports the custom idempotency store, then runs `pnpm install`, `stackra encore:prepare` in the
 *          service and `stackra gen` through the process port; `--dry-run` writes and runs nothing; `--no-install`
 *          writes and prints the commands; a failed command exits 1, runs nothing after it and names the re-run, which
 *          runs the codemods and every step again on the edited tree; a dirty tree, an inexact
 *          version and an unknown codemod exit 2; a workspace already on the target exits 0; `--list` prints the codemods.
 * Boundary: test only; the process port is a memory driver, so nothing is installed and no git runs. Writes the
 *           workspace under the OS temp folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (decision 2 and Enforcement); STA-145.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { UpgradeCommand } from "#node/commands/upgrade.command";
import { UPGRADE_CODEMODS } from "#node/upgrade/constants/upgrade-codemods.constant";
import { CONSUMER_FILES } from "#node/upgrade/functions/__tests__/consumer-files";
import { fixtureWorkspace } from "#node/upgrade/functions/__tests__/fixture-workspace";

let root: string;
let remove: () => void;

beforeEach(() => {
  ({ root, remove } = fixtureWorkspace(CONSUMER_FILES));
});

afterEach(() => remove());

const read = (path: string) => readFileSync(join(root, path), "utf8");

/** A process port where git reports a clean tree and every command succeeds, unless overridden. */
const processes = (overrides: Readonly<Record<string, { code: number; output?: string }>> = {}) => {
  const runner = new MemoryProcessRunnerDriver()
    .on("git status --porcelain", { code: 0, output: "" })
    .on("pnpm install", { code: 0 })
    .on("pnpm exec stackra encore:prepare", { code: 0 })
    .on("pnpm exec stackra gen", { code: 0 });
  for (const [line, result] of Object.entries(overrides)) runner.on(line, result);
  return runner;
};

describe("UpgradeCommand", () => {
  it("moves the pins, runs the codemods over the source, then installs, prepares the service and generates", async () => {
    const process = processes();
    const result = await runCommandForTest(
      [UpgradeCommand],
      ["upgrade", "--to", "0.33.1", "--json"],
      {
        cwd: root,
        process,
      },
    );
    expect(result.exitCode).toBe(0);
    expect(read("pnpm-workspace.yaml")).toContain('"@stackra/actions": 0.33.1');
    expect(read("pnpm-workspace.yaml")).not.toContain("0.29.0");
    expect(read("services/orders/package.json")).toContain('"@stackra/identity": "^0.33.1"');
    expect(read("services/orders/src/security.ts")).toBe(
      `import type { AccountSession } from "@stackra/identity/contracts";

export const sessions: AccountSession[] = [];
`,
    );
    // Not in range (0.4.0 is before 0.8.2), and never inside node_modules or gen's output.
    expect(read("apps/console/src/editor.tsx")).toBe(CONSUMER_FILES["apps/console/src/editor.tsx"]);
    expect(read("apps/console/.stackra/gen/clients.ts")).toBe(
      CONSUMER_FILES["apps/console/.stackra/gen/clients.ts"],
    );
    const data = (result.json as { data: Record<string, unknown> }).data;
    expect(data["from"]).toBe("0.8.2");
    expect(data["edits"]).toEqual([
      { file: "pnpm-workspace.yaml", by: ["versions"] },
      { file: "services/orders/package.json", by: ["versions"] },
      { file: "services/orders/src/security.ts", by: ["identity-account-session"] },
    ]);
    expect(data["findings"]).toEqual([
      {
        codemod: "actions-idempotency-complete-refused",
        file: "services/orders/src/drivers/memo-idempotency-store.driver.ts",
        line: 3,
        column: 8,
        code: "class MemoIdempotencyStore extends IdempotencyStore {}",
        message: expect.stringContaining("implement completeRefused"),
      },
    ]);
    expect(process.calls.map((call) => `${call.cwd}: ${call.line}`)).toEqual([
      `${root}: git status --porcelain`,
      `${root}: pnpm install`,
      `${join(root, "services/orders")}: pnpm exec stackra encore:prepare`,
      `${root}: pnpm exec stackra gen`,
    ]);
  });

  it("prints the notes and every diff under --dry-run, and writes and runs nothing", async () => {
    const process = processes();
    const result = await runCommandForTest(
      [UpgradeCommand],
      ["upgrade", "--to", "0.33.1", "--from", "0.3.0", "--dry-run"],
      { cwd: root, process },
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("stackra upgrade 0.3.0 → 0.33.1 (dry run)");
    expect(result.stdout).toContain("ui-rich-text-entry");
    expect(result.stdout).toContain('+import { RichTextEditor } from "@stackra/ui/rich-text";');
    expect(result.stdout).toContain("pnpm exec stackra gen");
    expect(process.calls).toEqual([]);
    for (const [path, text] of Object.entries(CONSUMER_FILES)) expect(read(path)).toBe(text);
  });

  it("writes the edits and prints the commands under --no-install", async () => {
    const process = processes();
    const result = await runCommandForTest(
      [UpgradeCommand],
      ["upgrade", "--to", "0.33.1", "--no-install"],
      { cwd: root, process },
    );
    expect(result.exitCode).toBe(0);
    expect(read("pnpm-workspace.yaml")).toContain('"@stackra/ui": 0.33.1');
    expect(process.calls.map((call) => call.line)).toEqual(["git status --porcelain"]);
    expect(result.stdout).toContain("Run next");
    expect(result.stdout).toContain("services/orders: pnpm exec stackra encore:prepare");
  });

  it("exits 1 when a command fails and runs nothing after it", async () => {
    const process = processes({
      "pnpm install": { code: 1, output: "ERR_PNPM_NO_MATCHING_VERSION" },
    });
    const result = await runCommandForTest([UpgradeCommand], ["upgrade", "--to", "0.33.1"], {
      cwd: root,
      process,
    });
    expect(result.exitCode).toBe(1);
    expect(process.calls.map((call) => call.line)).toEqual([
      "git status --porcelain",
      "pnpm install",
    ]);
    expect(result.stderr).toContain("pnpm install failed");
    expect(result.stderr).toContain("pnpm exec stackra gen");
    expect(result.stderr).toContain("stackra upgrade --from 0.8.2 --to 0.33.1 --allow-dirty");
  });

  it("finishes every step when the named re-run follows a failed install", async () => {
    const failing = processes({ "pnpm install": { code: 1, output: "ERR_PNPM_FETCH_503" } });
    const first = await runCommandForTest([UpgradeCommand], ["upgrade", "--to", "0.33.1"], {
      cwd: root,
      process: failing,
    });
    expect(first.exitCode).toBe(1);
    const edited = read("services/orders/src/security.ts");
    // The pins are moved and the tree is dirty now; the re-run the error names runs every step and changes nothing twice.
    const process = processes({
      "git status --porcelain": { code: 0, output: " M pnpm-workspace.yaml\n" },
    });
    const again = await runCommandForTest(
      [UpgradeCommand],
      ["upgrade", "--from", "0.8.2", "--to", "0.33.1", "--allow-dirty"],
      { cwd: root, process },
    );
    expect(again.exitCode).toBe(0);
    expect(again.stdout).not.toContain("already on");
    expect(process.calls.map((call) => `${call.cwd}: ${call.line}`)).toEqual([
      `${root}: pnpm install`,
      `${join(root, "services/orders")}: pnpm exec stackra encore:prepare`,
      `${root}: pnpm exec stackra gen`,
    ]);
    expect(read("services/orders/src/security.ts")).toBe(edited);
    expect(again.stdout).toContain("moved to 0.33.1: 0 files changed");
  });

  it("installs and generates on the re-run of a versions-only upgrade whose install failed", async () => {
    const failing = processes({ "pnpm install": { code: 1, output: "ERR_PNPM_FETCH_503" } });
    const argv = ["upgrade", "--from", "0.29.0", "--to", "0.29.1"];
    const first = await runCommandForTest([UpgradeCommand], argv, { cwd: root, process: failing });
    expect(first.exitCode).toBe(1);
    expect(first.stdout).toContain("only the @stackra/* versions move");
    expect(first.stderr).toContain("stackra upgrade --from 0.29.0 --to 0.29.1 --allow-dirty");
    // Every pin is on 0.29.1 now, so nothing moves; the named --from still runs the steps the first run never did.
    const process = processes();
    const again = await runCommandForTest([UpgradeCommand], [...argv, "--allow-dirty"], {
      cwd: root,
      process,
    });
    expect(again.exitCode).toBe(0);
    expect(process.calls.map((call) => call.line)).toEqual([
      "pnpm install",
      "pnpm exec stackra gen",
    ]);
  });

  it("refuses a dirty tree, an inexact version and an unknown codemod with exit 2, writing nothing", async () => {
    const dirty = processes({ "git status --porcelain": { code: 0, output: " M package.json\n" } });
    const cases = [
      { argv: ["upgrade", "--to", "0.33.1"], process: dirty, says: "uncommitted changes" },
      { argv: ["upgrade", "--to", "latest"], process: processes(), says: "exact version" },
      {
        argv: ["upgrade", "--to", "0.33.1", "--only", "nope"],
        process: processes(),
        says: "unknown codemod nope",
      },
    ];
    for (const { argv, process, says } of cases) {
      const result = await runCommandForTest([UpgradeCommand], argv, { cwd: root, process });
      expect(result.exitCode, argv.join(" ")).toBe(2);
      expect(result.stderr, argv.join(" ")).toContain(says);
    }
    for (const [path, text] of Object.entries(CONSUMER_FILES)) expect(read(path)).toBe(text);
  });

  it("says a workspace already on the target is up to date", async () => {
    const process = processes();
    const result = await runCommandForTest(
      [UpgradeCommand],
      ["upgrade", "--to", "0.29.0", "--from", "0.29.0"],
      {
        cwd: root,
        process,
      },
    );
    // services/orders still pins ^0.8.2, so 0.29.0 moves that pin and runs no codemod between 0.29.0 and 0.29.0.
    expect(result.exitCode).toBe(0);
    expect(read("services/orders/package.json")).toContain('"@stackra/identity": "^0.29.0"');
    expect(result.stdout).toContain("moved to 0.29.0: 1 file changed");
    const again = await runCommandForTest([UpgradeCommand], ["upgrade", "--to", "0.29.0"], {
      cwd: root,
      process: processes(),
    });
    expect(again.exitCode).toBe(0);
    expect(again.stdout).toContain("already on 0.29.0");
  });

  it("lists every codemod with its release under --list", async () => {
    const result = await runCommandForTest([UpgradeCommand], ["upgrade", "--list", "--json"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(0);
    expect((result.json as { data: unknown }).data).toEqual(
      UPGRADE_CODEMODS.map(({ id, version, title }) => ({ version, id, title })),
    );
  });
});
