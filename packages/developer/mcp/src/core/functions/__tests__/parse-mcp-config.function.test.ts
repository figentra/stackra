/**
 * Stackra file contract:
 * Purpose: unit tests of `parseMcpConfig`: the template's `.mcp.yaml` server shapes pass unchanged; an unknown key, a
 *          non-kebab server name, a remote server without a URL and a broken rule each fail as
 *          `McpConfigInvalidError` naming the path and a snake_case code.
 * Boundary: test only; pure values, no file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 9 and 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { McpConfigInvalidError } from "#core/errors/mcp-config-invalid.error";
import { parseMcpConfig } from "#core/functions/parse-mcp-config.function";
import type { McpIssue } from "#core/types/mcp-issue.type";

/** The template's server shapes, one of each kind. */
const TEMPLATE = {
  mcpServers: {
    stackra: { command: "pnpm", args: ["exec", "stackra", "mcp"] },
    "stackra-cloud": { type: "http", url: "https://mcp.stackra.figentra.com/mcp" },
    encore: { command: "encore", args: ["mcp", "run", "--app=acme-platform"] },
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
        "@upstash/context7-mcp@4.2.0",
        "--api-key",
        "$CONTEXT7_API_KEY",
      ],
    },
    "heroui-pro": {
      command: "pnpm",
      args: [
        "exec",
        "stackra",
        "mcp",
        "exec",
        "--",
        "npx",
        "-y",
        "mcp-remote@0.14.3",
        "https://mcp.heroui.pro/mcp",
        "--header",
        "x-heroui-personal-token:$HEROUI_PERSONAL_TOKEN",
      ],
    },
    posthog: { type: "http", url: "https://mcp.posthog.com/mcp?readonly=true" },
    playwright: { command: "npx", args: ["-y", "@playwright/mcp@0.0.83"] },
  },
};

/** The issues `run` fails with. */
function issuesOf(run: () => unknown): McpIssue[] {
  try {
    run();
  } catch (error) {
    if (error instanceof McpConfigInvalidError) return [...error.issues];
    throw error;
  }
  throw new Error("expected McpConfigInvalidError");
}

describe("parseMcpConfig", () => {
  it("returns the template's servers unchanged, in file order", () => {
    const config = parseMcpConfig(TEMPLATE);
    expect(config).toEqual(TEMPLATE);
    expect(Object.keys(config.mcpServers)).toEqual(Object.keys(TEMPLATE.mcpServers));
  });

  it("fails on an unknown key, a bad name or a remote server without a URL", () => {
    const paths = issuesOf(() =>
      parseMcpConfig({
        mcpServers: {
          Docs: { command: "docs" },
          remote: { type: "http" },
        },
        extra: true,
      }),
    ).map((issue) => issue.path);
    expect(paths).toEqual(expect.arrayContaining(["", "mcpServers.Docs", "mcpServers.remote"]));
  });

  it("fails on a broken rule after the shape passes", () => {
    const issues = issuesOf(() =>
      parseMcpConfig(
        { mcpServers: { docs: { command: "npx", args: ["-y", "docs-mcp@latest"] } } },
        "repo/.mcp.yaml",
      ),
    );
    expect(issues).toEqual([
      expect.objectContaining({ path: "mcpServers.docs", code: "unpinned_npx_server" }),
    ]);
    expect(() =>
      parseMcpConfig(
        { mcpServers: { docs: { command: "npx", args: ["-y", "docs-mcp"] } } },
        "repo/.mcp.yaml",
      ),
    ).toThrow(/^repo\/\.mcp\.yaml is invalid: /);
  });
});
