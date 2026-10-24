/**
 * Stackra file contract:
 * Purpose: unit tests of `MCP_EXEC_COMMAND`: it starts the command after `--` with the secret store location and
 *          returns its exit code, and refuses an empty command before starting anything.
 * Boundary: test only; `execWithSecrets` is replaced by a fake, so no process starts and no secret store is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; ADR 0257; ADR 0282 (decision 3).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { execWithSecrets } from "@stackra/mcp/node";

import { MCP_EXEC_COMMAND } from "#node/constants/mcp-exec-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/mcp/node", () => ({ execWithSecrets: vi.fn(async () => 5) }));

const context = (rest: readonly string[], values: CliContext["values"] = {}): CliContext => ({
  cwd: "/repo",
  io: captureIo().io,
  values,
  positionals: [],
  rest,
  cli: async () => 0,
});

describe("MCP_EXEC_COMMAND", () => {
  it("starts the command after -- with the secret store location and returns its code", async () => {
    const rest = ["npx", "-y", "server@1.0.0", "--key", "$CONTEXT7_API_KEY"];
    expect(await MCP_EXEC_COMMAND.run(context(rest, { env: "staging", path: "/ci" }))).toBe(5);
    expect(execWithSecrets).toHaveBeenLastCalledWith(rest, {
      cwd: "/repo",
      environment: "staging",
      path: "/ci",
    });
    await MCP_EXEC_COMMAND.run(context(["node", "server.js"]));
    expect(execWithSecrets).toHaveBeenLastCalledWith(["node", "server.js"], { cwd: "/repo" });
  });

  it("refuses an empty command", async () => {
    vi.mocked(execWithSecrets).mockClear();
    await expect(MCP_EXEC_COMMAND.run(context([]))).rejects.toThrow(CliUsageError);
    expect(execWithSecrets).not.toHaveBeenCalled();
  });
});
