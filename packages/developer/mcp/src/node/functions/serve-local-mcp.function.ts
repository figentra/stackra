/**
 * Stackra file contract:
 * Purpose: `serveLocalMcp(options)`, the local developer MCP behind `stackra mcp`: answers `initialize`, `ping`,
 *          `tools/list` and `tools/call` over stdio with the `LOCAL_TOOLS` (manifest reads and the CLI's `new`, `gen`,
 *          `validate` and `verify`) and every local Encore tool, proxied under an `encore_` prefix. Resolves when the
 *          client disconnects.
 * Boundary: every write runs through the given `StackraRunner`, the CLI's own commands and gates; this file writes
 *           nothing itself. Tool arguments are checked before anything runs. The hosted mode of ADR 0282 is a separate
 *           deployment, not this server.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode); R-29 (`stackra mcp` proxies the local Encore tools).
 */
import { z } from "zod";

import { LOCAL_TOOLS } from "#node/constants/local-tools.constant";
import { MCP_PROTOCOL_VERSIONS } from "#node/constants/mcp-protocol-versions.constant";
import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import { connectMcp } from "#node/functions/connect-mcp.function";
import { openEncoreMcp } from "#node/functions/open-encore-mcp.function";
import { readManifests } from "#node/functions/read-manifests.function";
import { spawnStackra } from "#node/functions/spawn-stackra.function";
import type { CommandOutcome } from "#node/types/command-outcome.type";
import type { ServeLocalMcpOptions } from "#node/types/serve-local-mcp-options.type";

/** The name prefix of a proxied Encore tool. */
const ENCORE = "encore_";

/** The most output one tool result carries; the tail is kept, where failures are. */
const OUTPUT_LIMIT = 20_000;

/** A text tool result. */
const textResult = (text: string, isError = false) => ({
  content: [{ type: "text", text }],
  isError,
});

/** The tool result of one CLI command. */
const commandResult = (args: readonly string[], { exitCode, output }: CommandOutcome) => {
  const cut = output.length - OUTPUT_LIMIT;
  const shown =
    cut > 0 ? `… (${cut} earlier characters cut)\n${output.slice(-OUTPUT_LIMIT)}` : output;
  return textResult(`$ stackra ${args.join(" ")}\n${shown}\nexit ${exitCode}`, exitCode !== 0);
};

/** `value` checked by `schema`, or an invalid-params error. */
const argumentsOf = <T extends z.ZodType>(schema: T, value: unknown): z.infer<T> => {
  const result = schema.safeParse(value ?? {});
  if (!result.success) throw new McpProtocolError(-32_602, z.prettifyError(result.error));
  return result.data;
};

/**
 * Serves the local MCP until the client disconnects.
 *
 * @param options - the version, and optionally the root, streams, CLI runner and Encore connection.
 * @example
 * // in @stackra/cli, `stackra mcp`:
 * await serveLocalMcp({ version: CLI_VERSION, run: (args) => commands.run(args) });
 */
export async function serveLocalMcp(options: ServeLocalMcpOptions): Promise<void> {
  const root = options.root ?? process.cwd();
  const run = options.run ?? spawnStackra(root);
  const upstream =
    options.encore === undefined
      ? openEncoreMcp(root, options.version)
      : Promise.resolve(options.encore);
  // shortcut: reads the first tools/list page only; follow `nextCursor` when Encore paginates its tools.
  const upstreamTools = upstream
    .then(async (peer) =>
      peer ? ((await peer.request("tools/list")) as { tools: { name: string }[] }).tools : [],
    )
    .catch(() => []);

  const callTool = async (params: unknown): Promise<unknown> => {
    const { name, arguments: args } = (params ?? {}) as { name?: unknown; arguments?: unknown };
    if (typeof name !== "string")
      throw new McpProtocolError(-32_602, "tools/call needs a tool name");
    if (name.startsWith(ENCORE)) {
      const peer = await upstream;
      if (peer === null)
        throw new McpProtocolError(
          -32_602,
          `Unknown tool: ${name} (the local Encore MCP is not running)`,
        );
      return peer.request("tools/call", { name: name.slice(ENCORE.length), arguments: args ?? {} });
    }
    switch (name) {
      case "manifest": {
        const input = argumentsOf(LOCAL_TOOLS.manifest.input, args);
        const manifests = readManifests(root).filter(
          (manifest) => !input.member || manifest.member === input.member,
        );
        if (manifests.length === 0)
          return textResult(
            `No stackra.manifest.json${input.member ? ` for ${input.member}` : ""}; run \`stackra gen\``,
            true,
          );
        const section = input.section;
        const body = section
          ? manifests.map((manifest) => ({
              member: manifest.member,
              [section]: (manifest as Record<string, unknown>)[section] ?? null,
            }))
          : manifests;
        return textResult(JSON.stringify(body, null, 2));
      }
      case "new": {
        const input = argumentsOf(LOCAL_TOOLS.new.input, args);
        const command = ["new", input.kind, input.name, ...(input.flags ?? [])];
        return commandResult(command, await run(command));
      }
      case "gen": {
        const command = argumentsOf(LOCAL_TOOLS.gen.input, args).check
          ? ["gen", "--check"]
          : ["gen"];
        return commandResult(command, await run(command));
      }
      case "validate":
      case "verify": {
        argumentsOf(LOCAL_TOOLS[name].input, args);
        return commandResult([name], await run([name]));
      }
      default: {
        throw new McpProtocolError(-32_602, `Unknown tool: ${name}`);
      }
    }
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
              ...Object.entries(LOCAL_TOOLS).map(([name, tool]) => ({
                name,
                description: tool.description,
                inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
                annotations: { readOnlyHint: tool.readOnly },
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
