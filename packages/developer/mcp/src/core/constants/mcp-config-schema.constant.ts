/**
 * Stackra file contract:
 * Purpose: `MCP_CONFIG_SCHEMA`, the shape of a project's `.mcp.yaml`: `mcpServers` keyed by a kebab-case name, each a
 *          local (stdio) server with a command, or a remote server with `type: http | sse` and a URL. It is the shape
 *          Claude Code reads from `.mcp.json`, so the rendered file is the parsed document unchanged.
 * Boundary: shape only. The rules a shape cannot say (a secret reference outside `stackra mcp exec`, an unpinned npx
 *           package) are `ruleIssues`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 3, 9 and 10); ADR 0173 (secret values never in files).
 */
import { z } from "zod";

/** A local server: Claude Code starts `command` with `args` and talks to it over stdio. */
const STDIO_SERVER = z.strictObject({
  type: z.literal("stdio").optional(),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string().regex(/^[A-Z][A-Z0-9_]*$/), z.string()).optional(),
});

/** A remote server: reached at `url`, signed in with OAuth on first use. */
const REMOTE_SERVER = z.strictObject({
  type: z.enum(["http", "sse"]),
  url: z.url({ protocol: /^https?$/ }),
  headers: z.record(z.string(), z.string()).optional(),
});

/** The whole `.mcp.yaml` document. */
export const MCP_CONFIG_SCHEMA = z.strictObject({
  mcpServers: z.record(
    z.string().regex(/^[a-z][a-z0-9-]*$/, "A server name is kebab-case"),
    z.union([STDIO_SERVER, REMOTE_SERVER]),
  ),
});
