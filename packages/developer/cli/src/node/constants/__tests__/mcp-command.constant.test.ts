/**
 * Stackra file contract:
 * Purpose: unit tests of `MCP_COMMAND`: it serves the local MCP with the CLI version and the working directory, and
 *          its runner runs the CLI in-process with a capturing io, returning the exit code and the output, and the run's
 *          abort signal goes to the server so a SIGTERM or SIGINT stops it.
 * Boundary: test only; `serveLocalMcp` is replaced by a fake, so no stdio server starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { serveLocalMcp } from "@stackra/mcp/node";

import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import type { CliIo } from "#node/types/cli-io.type";

vi.mock("@stackra/mcp/node", () => ({ serveLocalMcp: vi.fn(async () => undefined) }));

/** Runs `stackra mcp` in `/repo`, with the run's abort `signal` when there is one. */
const run = (signal?: AbortSignal) =>
  MCP_COMMAND.run({
    cwd: "/repo",
    io: captureIo().io,
    values: {},
    positionals: [],
    rest: [],
    cli: vi.fn(async () => 0),
    ...(signal === undefined ? {} : { signal }),
  });

describe("MCP_COMMAND", () => {
  it("serves the local MCP with the CLI version, the root and an in-process runner", async () => {
    const cli = vi.fn(async (_args: readonly string[], io: CliIo) => {
      io.out("checked\n");
      return 3;
    });
    expect(MCP_COMMAND.name).toBe("mcp");
    expect(
      await MCP_COMMAND.run({
        cwd: "/repo",
        io: captureIo().io,
        values: {},
        positionals: [],
        rest: [],
        cli,
      }),
    ).toBe(0);
    const options = vi.mocked(serveLocalMcp).mock.calls[0]?.[0];
    expect(options?.version).toBe(cliVersion());
    expect(options?.root).toBe("/repo");
    // doctor is served from its own command definition, read-only.
    expect(options?.tools?.map((tool) => [tool.name, tool.readOnly])).toEqual([["doctor", true]]);
    expect(await options?.run?.(["gen", "--check"])).toEqual({ exitCode: 3, output: "checked\n" });
    expect(cli.mock.calls[0]?.[0]).toEqual(["gen", "--check"]);
    expect(cli.mock.calls[0]?.[1].inherit).toBe(false);
  });

  it("hands the run's abort signal to the server, and none when the run has none", async () => {
    const controller = new AbortController();

    await run(controller.signal);
    expect(vi.mocked(serveLocalMcp).mock.lastCall?.[0].signal).toBe(controller.signal);

    await run();
    expect(vi.mocked(serveLocalMcp).mock.lastCall?.[0]).not.toHaveProperty("signal");
  });
});
