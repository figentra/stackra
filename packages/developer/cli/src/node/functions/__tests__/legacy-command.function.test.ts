/**
 * Stackra file contract:
 * Purpose: unit tests of `legacyCommand`'s hand-off of the run's abort signal: a command gets the signal of the run,
 *          not aborted while it runs, and a SIGTERM aborts it and ends the run with 143, so a command holding a handle
 *          open (`mcp` reading standard input) can let go of it. Before, `stackra mcp` ignored SIGTERM and SIGINT and
 *          stayed running until its client closed standard input.
 * Boundary: test only; the signals are a manual source, no process signal is sent.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0500 (decision 7); ADR 0282 (decision 5).
 */
import { createConsole } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";
import { manualSignals } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { legacyCommand } from "#node/functions/legacy-command.function";
import type { CliCommand } from "#node/types/cli-command.type";

describe("legacyCommand signal", () => {
  it("gives the command the run's abort signal, which SIGTERM aborts and the run ends with 143", async () => {
    const signals = manualSignals();
    let observed: AbortSignal | undefined;
    const waiting: CliCommand = {
      name: "wait",
      summary: "Waits for its signal",
      usage: "stackra wait",
      run: ({ signal }) =>
        new Promise<number>((resolve) => {
          observed = signal;
          signal?.addEventListener("abort", () => resolve(0));
        }),
    };
    const running = createConsole({
      name: "stackra",
      version: "0.0.0",
      commands: [legacyCommand(waiting, async () => 0, false)],
    }).run(["wait"], {
      ...nodePorts(),
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
      signals,
    });

    await vi.waitFor(() => expect(observed).toBeDefined());
    expect(observed?.aborted).toBe(false);
    signals.send("SIGTERM");

    await expect(running).resolves.toBe(143);
    expect(observed?.aborted).toBe(true);
  });

  it("ends a run on SIGINT with 130", async () => {
    const signals = manualSignals();
    let started = false;
    const waiting: CliCommand = {
      name: "wait",
      summary: "Waits for its signal",
      usage: "stackra wait",
      run: ({ signal }) =>
        new Promise<number>((resolve) => {
          started = true;
          signal?.addEventListener("abort", () => resolve(0));
        }),
    };
    const running = createConsole({
      name: "stackra",
      version: "0.0.0",
      commands: [legacyCommand(waiting, async () => 0, false)],
    }).run(["wait"], {
      ...nodePorts(),
      stdout: { write: () => undefined },
      stderr: { write: () => undefined },
      signals,
    });

    await vi.waitFor(() => expect(started).toBe(true));
    signals.send("SIGINT");

    await expect(running).resolves.toBe(130);
  });
});
