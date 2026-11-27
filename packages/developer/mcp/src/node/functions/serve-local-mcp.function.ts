/**
 * Stackra file contract:
 * Purpose: `serveLocalMcp(options)`, the local developer MCP behind `stackra mcp`: answers `initialize`, `ping`,
 *          `tools/list` and `tools/call` over stdio. Its tools are commands declared `tool`, served through `toolsOf`
 *          with their own schema, hints and handler: its own `DEV_TOOL_COMMANDS` (app facts, manifests, routes, and the
 *          CLI's new, gen, validate, check, verify, test, typecheck and lint with structured results), then the host's
 *          tools (one with a built-in's name replaces it), then every local Encore tool, proxied under an `encore_`
 *          prefix across every `tools/list` page. Each tool is listed with its MCP hints (read-only, destructive,
 *          idempotent). Every call of its own tools answers `structuredContent` `{ ok, diagnostics, data?, error? }`
 *          (`toolResult`): one `Diagnostic` list, each code linked to its `stackra explain` docs (`explainDocs`) through
 *          the same runner. Resolves when the client disconnects.
 * Boundary: every write runs through the given `StackraRunner`, the CLI's own commands and gates; this file writes
 *           nothing itself. A tool that is not read-only is refused, before it runs, when the server runs in a deployed
 *           environment or the call names one (`deployedTarget`). A tool's input is checked by its command, and a bad
 *           input is a tool error the assistant can correct; an unknown tool is a protocol error. The hosted mode of
 *           ADR 0282 is a separate deployment, not this server.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode); R-29 (`stackra mcp` proxies the local Encore tools);
 *                     STA-1966 FR-020; STA-2873; STA-2886 (one Diagnostic contract).
 */
import { toolsOf } from "@stackra/console";

import { DEV_TOOL_COMMANDS } from "#node/constants/dev-tool-commands.constant";
import { MCP_PROTOCOL_VERSIONS } from "#node/constants/mcp-protocol-versions.constant";
import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import { connectMcp } from "#node/functions/connect-mcp.function";
import { deployedTarget } from "#node/functions/deployed-target.function";
import { devToolContainer } from "#node/functions/dev-tool-container.function";
import { explainDocs } from "#node/functions/explain-docs.function";
import { listUpstreamTools } from "#node/functions/list-upstream-tools.function";
import { openEncoreMcp } from "#node/functions/open-encore-mcp.function";
import { spawnStackra } from "#node/functions/spawn-stackra.function";
import { toolResult } from "#node/functions/tool-result.function";
import type { LocalTool } from "#node/types/local-tool.type";
import type { ServeLocalMcpOptions } from "#node/types/serve-local-mcp-options.type";
import type { UpstreamTool } from "#node/types/upstream-tool.type";

/** The name prefix of a proxied Encore tool. */
const ENCORE = "encore_";

/** The MCP hints of a tool: read-only says it all; a writing tool states what it may do (MCP defaults when unsaid). */
const annotationsOf = (tool: LocalTool) =>
  tool.readOnly
    ? { readOnlyHint: true }
    : {
        readOnlyHint: false,
        destructiveHint: tool.destructive ?? true,
        idempotentHint: tool.idempotent ?? false,
      };

/** The tool result refusing a write on a deployed target: one `deployed_target` diagnostic. */
const refusal = (name: string, reason: string) =>
  toolResult(
    name,
    {
      ok: false,
      error: {
        code: "deployed_target",
        message: `${name} writes, and ${reason}: the local developer MCP only writes in dev or test`,
        fix: "run it from a local checkout, or through the deploy path for that environment",
      },
    },
    1,
  );

/**
 * Serves the local MCP until the client disconnects.
 *
 * @param options - the version, and optionally the root, streams, CLI runner, Encore connection, host tools and
 *   environment.
 * @example
 * // in @stackra/cli, `stackra mcp`:
 * await serveLocalMcp({ version: CLI_VERSION, run: (args, at) => commands.run(args, at) });
 */
export async function serveLocalMcp(options: ServeLocalMcpOptions): Promise<void> {
  const root = options.root ?? process.cwd();
  const env = options.env ?? process.env;
  const run = options.run ?? spawnStackra(root);
  const docs = explainDocs(run);
  const upstream =
    options.encore === undefined
      ? openEncoreMcp(root, options.version)
      : Promise.resolve(options.encore);
  const upstreamTools: Promise<UpstreamTool[]> = upstream
    .then(async (peer) => (peer ? listUpstreamTools(peer) : []))
    .catch(() => []);

  const builtIn = toolsOf(
    {
      name: "stackra",
      version: options.version,
      commands: DEV_TOOL_COMMANDS,
      container: () => devToolContainer(run, env),
    },
    { cwd: root, env },
  );
  // A host tool with a built-in's name takes its place in the list.
  const tools = new Map<string, LocalTool>(
    [...builtIn, ...(options.tools ?? [])].map((tool) => [tool.name, tool]),
  );

  const callTool = async (params: unknown): Promise<unknown> => {
    const { name, arguments: args } = (params ?? {}) as { name?: unknown; arguments?: unknown };
    if (typeof name !== "string")
      throw new McpProtocolError(-32_602, "tools/call needs a tool name");
    const tool = tools.get(name);
    if (tool !== undefined) {
      const reason = tool.readOnly ? undefined : deployedTarget(env, args);
      if (reason !== undefined) return refusal(name, reason);
      // The command's own --json document, as one diagnostic report; its exit code decides isError.
      const { document, exitCode } = await tool.invoke(args ?? {});
      return toolResult(name, document, exitCode, docs);
    }
    if (name.startsWith(ENCORE)) {
      const peer = await upstream;
      if (peer === null)
        throw new McpProtocolError(
          -32_602,
          `Unknown tool: ${name} (the local Encore MCP is not running)`,
        );
      const upstreamName = name.slice(ENCORE.length);
      const listed = (await upstreamTools).find((candidate) => candidate.name === upstreamName);
      // Only an Encore tool that says it is read-only skips the deployed-target check.
      const reason =
        listed?.annotations?.readOnlyHint === true ? undefined : deployedTarget(env, args);
      if (reason !== undefined) return refusal(name, reason);
      return peer.request("tools/call", { name: upstreamName, arguments: args ?? {} });
    }
    throw new McpProtocolError(-32_602, `Unknown tool: ${name}`);
  };

  const peer = connectMcp(
    options.input ?? process.stdin,
    options.output ?? process.stdout,
    async (method, params) => {
      switch (method) {
        case "initialize": {
          const requested = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion;
          return {
            protocolVersion:
              typeof requested === "string" && MCP_PROTOCOL_VERSIONS.includes(requested)
                ? requested
                : MCP_PROTOCOL_VERSIONS[0],
            capabilities: { tools: {} },
            serverInfo: { name: "stackra", version: options.version },
          };
        }
        case "ping": {
          return {};
        }
        case "tools/list": {
          return {
            tools: [
              ...[...tools.values()].map((tool) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                annotations: annotationsOf(tool),
              })),
              ...(await upstreamTools).map((tool) => ({ ...tool, name: `${ENCORE}${tool.name}` })),
            ],
          };
        }
        case "tools/call": {
          return callTool(params);
        }
        default: {
          if (method.startsWith("notifications/")) return undefined;
          throw new McpProtocolError(-32_601, `Method not found: ${method}`);
        }
      }
    },
  );

  await peer.closed;
  (await upstream)?.close();
}
