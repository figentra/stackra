/**
 * Stackra file contract:
 * Purpose: unit tests of `ruleIssues`: a local server names its secrets with `stackra mcp exec --env` and holds no
 *          secret reference on its command line (STA-1617) or in env, nor a remote one in a URL or a header; npx
 *          packages must be pinned to an exact version.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 9); ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { ruleIssues } from "#core/functions/rule-issues.function";

/** The codes `ruleIssues` reports for one server. */
const codesOf = (server: Parameters<typeof ruleIssues>[0]["mcpServers"][string]): string[] =>
  ruleIssues({ mcpServers: { one: server } }).map((issue) => issue.code);

describe("ruleIssues", () => {
  it("accepts a secret named with --env and pinned npx packages", () => {
    expect(
      codesOf({
        command: "stackra",
        args: ["mcp", "exec", "--env", "TOKEN", "--", "npx", "-y", "@scope/tool@1.2.3"],
      }),
    ).toEqual([]);
    expect(codesOf({ command: "npx", args: ["-y", "tool@1.2.3-beta.1"] })).toEqual([]);
    expect(
      codesOf({ command: "encore", args: ["mcp", "run"], env: { NODE_ENV: "production" } }),
    ).toEqual([]);
    expect(codesOf({ type: "http", url: "https://mcp.linear.app/mcp" })).toEqual([]);
  });

  it("refuses a secret reference anywhere on a local server's command line (STA-1617)", () => {
    expect(codesOf({ command: "npx", args: ["-y", "tool@1.0.0", "--key", "$API_KEY"] })).toEqual([
      "secret_on_argv",
    ]);
    expect(
      codesOf({
        command: "pnpm",
        args: ["--key=$API_KEY", "exec", "stackra", "mcp", "exec", "--", "tool"],
      }),
    ).toEqual(["secret_on_argv"]);
    const after = ruleIssues({
      mcpServers: {
        context7: {
          command: "pnpm",
          args: [
            "exec",
            "stackra",
            "mcp",
            "exec",
            "--",
            "npx",
            "-y",
            "ctx@4.2.0",
            "--api-key",
            "$CONTEXT7_API_KEY",
          ],
        },
      },
    });
    expect(after).toEqual([
      expect.objectContaining({ path: "mcpServers.context7", code: "secret_on_argv" }),
    ]);
    expect(after[0]?.message).toContain("stackra mcp exec --env CONTEXT7_API_KEY --");
  });

  it("refuses a secret reference in env, which Claude Code passes literally", () => {
    expect(
      codesOf({
        command: "pnpm",
        args: ["exec", "stackra", "mcp", "exec", "--", "tool"],
        env: { KEY: "$API_KEY" },
      }),
    ).toEqual(["secret_without_exec"]);
  });

  it("refuses a secret in a remote server and names it", () => {
    const issues = ruleIssues({
      mcpServers: {
        api: {
          type: "http",
          url: "https://example.com/mcp",
          headers: { authorization: "Bearer $API_TOKEN" },
        },
      },
    });
    expect(issues).toEqual([
      expect.objectContaining({ path: "mcpServers.api", code: "secret_in_remote_server" }),
    ]);
    expect(issues[0]?.message).toContain("API_TOKEN");
  });

  it("refuses an unpinned, ranged or missing npx package", () => {
    expect(codesOf({ command: "npx", args: ["-y", "tool"] })).toEqual(["unpinned_npx_server"]);
    expect(codesOf({ command: "npx", args: ["-y", "tool@latest"] })).toEqual([
      "unpinned_npx_server",
    ]);
    expect(codesOf({ command: "npx", args: ["-y", "tool@^1.2.3"] })).toEqual([
      "unpinned_npx_server",
    ]);
    expect(codesOf({ command: "npx", args: ["-y"] })).toEqual(["unpinned_npx_server"]);
  });
});
