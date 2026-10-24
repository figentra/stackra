/**
 * Stackra file contract:
 * Purpose: unit tests of `ruleIssues`: a secret reference must sit after `stackra mcp exec --` in a local server and
 *          never in env, a URL or a header; npx packages must be pinned to an exact version.
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
  it("accepts a secret after the launcher and pinned npx packages", () => {
    expect(
      codesOf({
        command: "stackra",
        args: ["mcp", "exec", "--", "npx", "-y", "@scope/tool@1.2.3", "$TOKEN"],
      }),
    ).toEqual([]);
    expect(codesOf({ command: "npx", args: ["-y", "tool@1.2.3-beta.1"] })).toEqual([]);
    expect(
      codesOf({ command: "encore", args: ["mcp", "run"], env: { NODE_ENV: "production" } }),
    ).toEqual([]);
    expect(codesOf({ type: "http", url: "https://mcp.linear.app/mcp" })).toEqual([]);
  });

  it("refuses a secret without the launcher, before it or in env", () => {
    expect(codesOf({ command: "npx", args: ["-y", "tool@1.0.0", "--key", "$API_KEY"] })).toEqual([
      "secret_without_exec",
    ]);
    expect(
      codesOf({
        command: "pnpm",
        args: ["--key=$API_KEY", "exec", "stackra", "mcp", "exec", "--", "tool"],
      }),
    ).toEqual(["secret_without_exec"]);
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
