/**
 * Stackra file contract:
 * Purpose: unit tests of `DEV_COMMAND`: it is the registered `dev`, surface flags need `--surface`, and a surface run
 *          stops with a usage error before gen when the surface is bad.
 * Boundary: test only; runs `runCli` against a temporary product root; no tool process starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 6).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { COMMANDS } from "#node/constants/commands.constant";
import { DEV_COMMAND } from "#node/dev-surface/constants/dev-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { runCli } from "#node/functions/run-cli.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-dev-"));
  writeFileSync(
    join(root, "runway.yaml"),
    'surfaces:\n  console:\n    shell: os/console@3\n    packages:\n      - "@acme/console-ui"\n',
  );
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("DEV_COMMAND", () => {
  it("is the registered dev command and documents the surface mode", () => {
    expect(COMMANDS.find((command) => command.name === "dev")).toBe(DEV_COMMAND);
    expect(DEV_COMMAND.usage).toContain("--surface <surface>");
  });

  it("refuses a surface flag without --surface", async () => {
    const { io, output } = captureIo();
    expect(await runCli(["dev", "--os", "../os"], io, { cwd: root })).toBe(2);
    expect(output()).toContain("--os needs --surface");
  });

  it("refuses a bad or unknown surface, and a surface with no API, before running gen", async () => {
    for (const args of [
      ["dev", "--surface", "../x"],
      ["dev", "--surface", "till"],
      ["dev", "--surface", "console", "--shell-origin", "https://shells.example.test"],
    ]) {
      const { io } = captureIo();
      expect(await runCli(args, io, { cwd: root })).toBe(2);
    }
  });
});
