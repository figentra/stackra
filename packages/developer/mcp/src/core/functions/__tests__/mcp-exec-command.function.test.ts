/**
 * Stackra file contract:
 * Purpose: unit tests of `mcpExecCommand`: a command naming no secret starts unchanged; one naming secrets runs under
 *          one `sops exec-env` per secret file of the clone's `agents` scope, nested, around an `sh -c` line; a
 *          command naming a secret without a clone, and an empty command, fail.
 * Boundary: test only; builds commands, runs nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525.
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

  it("wraps a command with one secret in sops exec-env on that secret's file", () => {
    const argv = ["npx", "-y", "@upstash/context7-mcp@4.2.0", "--api-key", "$CONTEXT7_API_KEY"];
    expect(mcpExecCommand(argv, { secretsDir: "/s" })).toEqual({
      command: "sops",
      args: ["exec-env", "/s/agents/CONTEXT7_API_KEY.enc.yaml", `exec ${shellCommandLine(argv)}`],
    });
  });

  it("nests one sops exec-env per further secret, quoting the inner line whole", () => {
    const argv = ["mcp", "--a", "$A_KEY", "--b", "$B_KEY"];
    const { command, args } = mcpExecCommand(argv, { secretsDir: "/s" });
    expect(command).toBe("sops");
    expect(args).toEqual([
      "exec-env",
      "/s/agents/A_KEY.enc.yaml",
      `exec 'sops' 'exec-env' '/s/agents/B_KEY.enc.yaml' '${`exec ${shellCommandLine(argv)}`.replaceAll("'", `'\\''`)}'`,
    ]);
  });

  it("fails on a secret without a clone, and without a command", () => {
    expect(() => mcpExecCommand(["mcp", "$A_KEY"])).toThrow(/no figentra\/secrets clone/);
    expect(() => mcpExecCommand([])).toThrow(/no command given/);
  });
});
