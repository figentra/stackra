/**
 * Stackra file contract:
 * Purpose: unit tests of `MCP_EXEC_COMMAND`: it starts the command after `--` in the working directory (the clone of
 *          figentra/secrets is `execWithSecrets`' default) with the `--env` names as its secrets and returns its exit
 *          code, and refuses an empty command or an empty `--env` before starting anything.
 * Boundary: test only; `execWithSecrets` is replaced by a fake, so no process starts and no secret store is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; ADR 0257; ADR 0282 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

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
  it("starts the command after -- in the working directory and returns its code", async () => {
    const rest = ["npx", "-y", "server@1.0.0"];
    expect(await MCP_EXEC_COMMAND.run(context(rest, { env: "CONTEXT7_API_KEY,OTHER_KEY" }))).toBe(
      5,
    );
    expect(execWithSecrets).toHaveBeenLastCalledWith(rest, {
      cwd: "/repo",
      secrets: ["CONTEXT7_API_KEY", "OTHER_KEY"],
    });
    await MCP_EXEC_COMMAND.run(context(["node", "server.js"]));
    expect(execWithSecrets).toHaveBeenLastCalledWith(["node", "server.js"], { cwd: "/repo" });
  });

  it("refuses an empty command or an empty --env", async () => {
    vi.mocked(execWithSecrets).mockClear();
    await expect(MCP_EXEC_COMMAND.run(context([]))).rejects.toThrow(CliUsageError);
    await expect(MCP_EXEC_COMMAND.run(context(["node"], { env: "" }))).rejects.toThrow(
      CliUsageError,
    );
    expect(execWithSecrets).not.toHaveBeenCalled();
  });

  it("declares --env, so the parser accepts it", () => {
    expect(MCP_EXEC_COMMAND.options).toEqual({ env: { type: "string" } });
    expect(MCP_EXEC_COMMAND.usage).toContain("--env NAME");
  });
});
