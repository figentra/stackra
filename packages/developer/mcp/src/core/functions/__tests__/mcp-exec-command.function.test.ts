/**
 * Stackra file contract:
 * Purpose: unit tests of `mcpExecCommand`: a command naming no secret starts unchanged; one naming secrets with
 *          `--env` runs under one `sops exec-env` per secret file of the clone's `agents` scope, nested, around an
 *          `sh -c` line with no expansion, so each value reaches the server's environment and never its argv
 *          (STA-1617); a `$NAME` reference in the command, a bad name, a secret without a clone and an empty command
 *          fail.
 * Boundary: test only; builds commands, runs nothing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525; STA-1617.
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
    expect(mcpExecCommand(["npx", "x@1.0.0"], { secrets: [] })).toEqual({
      command: "npx",
      args: ["x@1.0.0"],
    });
  });

  it("wraps a command with one secret in sops exec-env on that secret's file, with no expansion", () => {
    const argv = ["npx", "-y", "@upstash/context7-mcp@4.9.0"];
    const built = mcpExecCommand(argv, { secretsDir: "/s", secrets: ["CONTEXT7_API_KEY"] });
    expect(built).toEqual({
      command: "sops",
      args: [
        "exec-env",
        "/s/agents/CONTEXT7_API_KEY.enc.yaml",
        "exec 'npx' '-y' '@upstash/context7-mcp@4.9.0'",
      ],
    });
    expect(built.args.join(" ")).not.toContain("$");
  });

  it("nests one sops exec-env per further secret, quoting the inner line whole, once per name", () => {
    const argv = ["mcp", "--a"];
    const { command, args } = mcpExecCommand(argv, {
      secretsDir: "/s",
      secrets: ["A_KEY", "B_KEY", "A_KEY"],
    });
    expect(command).toBe("sops");
    expect(args).toEqual([
      "exec-env",
      "/s/agents/A_KEY.enc.yaml",
      `exec 'sops' 'exec-env' '/s/agents/B_KEY.enc.yaml' '${`exec ${shellCommandLine(argv)}`.replaceAll("'", `'\\''`)}'`,
    ]);
  });

  it("refuses a secret reference in the command: expanded, it would sit on the server's argv", () => {
    for (const argv of [
      ["npx", "-y", "@upstash/context7-mcp@4.2.0", "--api-key", "$CONTEXT7_API_KEY"],
      ["npx", "mcp-remote@0.17.1", "https://x.example/mcp", "--header", "x-token:$TOKEN"],
    ])
      expect(() =>
        mcpExecCommand(argv, { secretsDir: "/s", secrets: ["CONTEXT7_API_KEY", "TOKEN"] }),
      ).toThrow(
        /in the server's arguments would show in every process listing; name it with --env/,
      );
  });

  it("refuses a name that is not SCREAMING_SNAKE without echoing it", () => {
    const pasted = "sk_live_not_a_name";
    expect(() => mcpExecCommand(["mcp"], { secretsDir: "/s", secrets: [pasted] })).toThrow(
      /every --env name is SCREAMING_SNAKE/,
    );
    try {
      mcpExecCommand(["mcp"], { secretsDir: "/s", secrets: [pasted] });
    } catch (error) {
      expect((error as Error).message).not.toContain(pasted);
    }
  });

  it("fails on a secret without a clone, and without a command", () => {
    expect(() => mcpExecCommand(["mcp"], { secrets: ["A_KEY"] })).toThrow(
      /no figentra\/secrets clone/,
    );
    expect(() => mcpExecCommand([])).toThrow(/no command given/);
  });
});
