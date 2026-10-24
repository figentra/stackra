/**
 * Stackra file contract:
 * Purpose: `ruleIssues(config)`, the `.mcp.yaml` rules a shape cannot say: a `$NAME` reference in a local server that
 *          does not start through `stackra mcp exec --` (Claude Code would pass it literally), a `$NAME` reference in a
 *          remote server (those sign in with OAuth), and an npx package not pinned to an exact version.
 * Boundary: reads a shape-valid document; returns issues and throws nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 9 and 10); ADR 0173 (secret values never in files); the template's
 *                     `.mcp.yaml` contract (npx servers pinned, no @latest).
 */
import { secretNamesOf } from "#core/functions/secret-names-of.function";
import type { McpConfig } from "#core/types/mcp-config.type";
import type { McpIssue } from "#core/types/mcp-issue.type";

/** `stackra mcp exec --`, the launcher that injects secret values. */
const EXEC = ["stackra", "mcp", "exec", "--"];

/** An npx package spec pinned to an exact version (`name@1.2.3`, `@scope/name@1.2.3-beta.1`). */
const PINNED = /^(?:@[^/@]+\/)?[^@]+@\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;

/**
 * Every rule a shape-valid `.mcp.yaml` breaks.
 *
 * @param config - the document after `MCP_CONFIG_SCHEMA`.
 * @example
 * ruleIssues({ mcpServers: { docs: { command: "npx", args: ["-y", "docs-mcp@latest"] } } });
 * // [{ path: "mcpServers.docs", code: "unpinned_npx_server", message: "…" }]
 */
export function ruleIssues(config: McpConfig): McpIssue[] {
  const issues: McpIssue[] = [];
  for (const [name, server] of Object.entries(config.mcpServers)) {
    const path = `mcpServers.${name}`;
    if ("url" in server) {
      const names = secretNamesOf([server.url, ...Object.values(server.headers ?? {})]);
      if (names.length > 0)
        issues.push({
          path,
          code: "secret_in_remote_server",
          message: `${names.join(", ")} in a remote server: sign in with OAuth, or run mcp-remote through \`stackra mcp exec --\``,
        });
      continue;
    }
    const argv = [server.command, ...(server.args ?? [])];
    const execAt = argv.findIndex((_, index) =>
      EXEC.every((word, offset) => argv[index + offset] === word),
    );
    // Only arguments after the launcher are expanded; env values and earlier arguments reach the server literally.
    const names = secretNamesOf([
      ...(execAt === -1 ? argv : argv.slice(0, execAt)),
      ...Object.values(server.env ?? {}),
    ]);
    if (names.length > 0)
      issues.push({
        path,
        code: "secret_without_exec",
        message: `${names.join(", ")} must reach the server through \`stackra mcp exec --\` arguments, never env or a literal`,
      });
    const npxAt = argv.indexOf("npx");
    if (npxAt === -1) continue;
    const spec = argv.slice(npxAt + 1).find((argument) => !argument.startsWith("-"));
    if (spec === undefined || !PINNED.test(spec))
      issues.push({
        path,
        code: "unpinned_npx_server",
        message: `npx package ${spec ?? "(none)"} is not pinned to an exact version; write name@x.y.z`,
      });
  }
  return issues;
}
