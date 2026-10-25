/**
 * Stackra file contract:
 * Purpose: unit tests of `mcpExecCommand`: a command naming no secret starts unchanged; one naming a secret runs under
 *          `infisical run` for the given (or default `dev`, `/agents`) location around an `sh -c` line; an empty
 *          command fails.
 * Boundary: test only; builds commands, runs nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; ADR 0257; ADR 0282 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { mcpExecCommand } from "#core/functions/mcp-exec-command.function";
import { shellCommandLine } from "#core/functions/shell-command-line.function";

describe("mcpExecCommand", () => {
  it("starts a command without secrets unchanged", () => {
    expect(mcpExecCommand(["npx", "-y", "@playwright/mcp@0.0.83"])).toEqual({
      command: "npx",
      args: ["-y", "@playwright/mcp@0.0.83"],
    });
  });

  it("wraps a command with secrets in infisical run, defaulting to dev and /agents", () => {
    const argv = ["npx", "-y", "@upstash/context7-mcp@4.2.0", "--api-key", "$CONTEXT7_API_KEY"];
    expect(mcpExecCommand(argv)).toEqual({
      command: "infisical",
      args: [
        "run",
        "--env=dev",
        "--path=/agents",
        "--silent",
        "--",
        "sh",
        "-c",
        `exec ${shellCommandLine(argv)}`,
      ],
    });
    expect(
      mcpExecCommand(argv, { environment: "staging", path: "/install" }).args.slice(0, 3),
    ).toEqual(["run", "--env=staging", "--path=/install"]);
  });

  it("fails without a command", () => {
    expect(() => mcpExecCommand([])).toThrow(/no command given/);
  });
});
