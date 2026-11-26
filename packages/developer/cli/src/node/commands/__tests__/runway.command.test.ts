/**
 * Stackra file contract:
 * Purpose: unit tests of `RunwayCommand`: `stackra runway` is a registered command, its help lists Runway's own
 *          commands, and a bare `stackra runway` is a usage error, as the `runway` binary's is.
 * Boundary: test only; runs `runCli` with captured streams; no Runway command does any work.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0529 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayCommand } from "#node/commands/runway.command";
import { COMMANDS } from "#node/constants/commands.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { runCli } from "#node/functions/run-cli.function";

describe("RunwayCommand", () => {
  /** It is part of the `stackra` command set. */
  it("is registered", () => {
    expect(COMMANDS).toContain(RunwayCommand);
  });

  /** `stackra runway help` reaches Runway's own console, which lists its commands. */
  it("lists Runway's commands under stackra runway help", async () => {
    const { io, output } = captureIo();
    const code = await runCli(["runway", "help"], io);
    expect(code).toBe(0);
    expect(output()).toMatch(/plan/);
    expect(output()).toMatch(/status/);
  });

  /** Runway needs a command, as the old binary did. */
  it("refuses a bare stackra runway with a usage error", async () => {
    const { io } = captureIo();
    expect(await runCli(["runway"], io)).toBe(2);
  });
});
