/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateCommand` on the console: its steps run through the process port as tasks, gen's summary
 *          is drawn as a tree, and a failed step stops the run and shows the tail of its output.
 * Boundary: test only; the starter is a stub, the folder a temporary one and every child process scripted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec User Story 1; STA-1966.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MemoryProcessRunnerDriver, runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CreateCommand } from "#node/commands/create.command";

const encoder = new TextEncoder();

vi.mock("#node/create/functions/read-starter.function", () => ({
  readStarter: () =>
    new Map<string, Uint8Array>([
      [
        "stackra.starter.yaml",
        encoder.encode("version: 1\nrename: []\nprofiles:\n  minimal:\n    include: ['*']\n"),
      ],
      ["package.json", encoder.encode('{"name":"acme"}')],
    ]),
}));

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-create-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const argv = ["create", "app", "--starter", "starter", "--yes", "--no-doctor"];

describe("CreateCommand", () => {
  it("runs install, gen, type-check and tests as process steps and draws gen's files as a tree", async () => {
    const process = new MemoryProcessRunnerDriver()
      .on("pnpm install")
      .on("pnpm exec stackra gen", {
        output:
          "wrote services/example/stackra.manifest.json\nwrote services/example/.stackra/gen/wiring.ts\n",
      })
      .on("pnpm run typecheck")
      .on("pnpm run test")
      .on("git init -q")
      .on("git add -A")
      .on("git commit -q -m chore: create the app with stackra create");
    const result = await runCommandForTest([CreateCommand], argv, { process, cwd: root });
    expect(result.exitCode).toBe(0);
    expect(process.calls.map((call) => call.line)).toEqual([
      "pnpm install",
      "pnpm exec stackra gen",
      "pnpm run typecheck",
      "pnpm run test",
      "git init -q",
      "git add -A",
      "git commit -q -m chore: create the app with stackra create",
    ]);
    expect(process.calls[0]?.cwd).toBe(join(root, "app"));
    expect(result.stdout).toContain("stackra gen wrote 2 files");
    expect(result.stdout).toContain("services/example");
    expect(result.stdout).toContain("the contract");
  });

  it("stops at a failed step and shows the tail of its output", async () => {
    const process = new MemoryProcessRunnerDriver()
      .on("pnpm install")
      .on("pnpm exec stackra gen", { code: 1, output: "gen exploded: no such member\n" });
    const result = await runCommandForTest([CreateCommand], argv, { process, cwd: root });
    expect(result.exitCode).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("gen exploded: no such member");
    expect(process.calls.map((call) => call.line)).toEqual([
      "pnpm install",
      "pnpm exec stackra gen",
    ]);
  });
});
