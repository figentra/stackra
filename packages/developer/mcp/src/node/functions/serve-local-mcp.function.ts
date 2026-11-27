/**
 * Stackra file contract:
 * Purpose: `serveLocalMcp(options)`, the local developer MCP behind `stackra mcp`: answers `initialize`, `ping`,
 *          `tools/list` and `tools/call` over stdio with the `LOCAL_TOOLS` (manifest reads and the CLI's `new`, `gen`,
 *          `validate` and `verify`) and every local Encore tool, proxied under an `encore_` prefix; `resources/list`,
 *          `resources/templates/list` and `resources/read` with `stackra://guidelines`, the manifests and the rules and
 *          skills of `@stackra/skills`; and `prompts/list` and `prompts/get` with the `LOCAL_PROMPTS` recipes
 *          (STA-2919). Resolves when the client disconnects.
 * Boundary: every write runs through the given `StackraRunner`, the CLI's own commands and gates; this file writes
 *           nothing itself. Tool and prompt arguments are checked before anything runs; resources and prompts only
 *           read files. The skill set is loaded on the first resource or prompt request. The hosted mode of ADR 0282 is a separate
 *           deployment, not this server.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode; decisions 6 and 7: layer 1 only); R-29 (`stackra mcp` proxies
 *                     the local Encore tools); STA-2919 (resources and prompts).
 */
import type { AgentDocument } from "@stackra/skills";
import { loadSkillSet } from "@stackra/skills/node";
import { z } from "zod";

import { LOCAL_PROMPTS } from "#node/constants/local-prompts.constant";
import { LOCAL_RESOURCE_TEMPLATES } from "#node/constants/local-resource-templates.constant";
import { LOCAL_TOOLS } from "#node/constants/local-tools.constant";
import { MCP_PROTOCOL_VERSIONS } from "#node/constants/mcp-protocol-versions.constant";
import { McpProtocolError } from "#node/errors/mcp-protocol.error";
import { argumentsOf } from "#node/functions/arguments-of.function";
import { connectMcp } from "#node/functions/connect-mcp.function";
import { getLocalPrompt } from "#node/functions/get-local-prompt.function";
import { listLocalResources } from "#node/functions/list-local-resources.function";
import { openEncoreMcp } from "#node/functions/open-encore-mcp.function";
import { promptArguments } from "#node/functions/prompt-arguments.function";
import { readLocalResource } from "#node/functions/read-local-resource.function";
import { readManifests } from "#node/functions/read-manifests.function";
import { spawnStackra } from "#node/functions/spawn-stackra.function";
import type { CommandOutcome } from "#node/types/command-outcome.type";
import type { LocalKnowledge } from "#node/types/local-knowledge.type";
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

  const commandTools = new Map((options.tools ?? []).map((tool) => [tool.name, tool]));

  // The resources and prompts read the open conventions of @stackra/skills, loaded once on first use.
  let documents: readonly AgentDocument[] | undefined = options.skills;
  const toolNames: ReadonlySet<string> = new Set([
    ...Object.keys(LOCAL_TOOLS),
    ...commandTools.keys(),
  ]);
  const knowledge = (): LocalKnowledge => {
    documents ??= loadSkillSet();
    return { root, documents, tools: toolNames };
  };

  const callTool = async (params: unknown): Promise<unknown> => {
    const { name, arguments: args } = (params ?? {}) as { name?: unknown; arguments?: unknown };
    if (typeof name !== "string")
      throw new McpProtocolError(-32_602, "tools/call needs a tool name");
    const fromCommand = commandTools.get(name);
    if (fromCommand !== undefined) {
      // The command's own --json document is the structured result; its exit code decides isError.
      const { document, exitCode } = await fromCommand.invoke(args ?? {});
      return {
        content: [{ type: "text", text: JSON.stringify(document, null, 2) }],
        structuredContent: document,
        isError: exitCode !== 0,
      };
    }
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
            capabilities: { tools: {}, resources: {}, prompts: {} },
            serverInfo: { name: "stackra", version: options.version },
          };
        }
        case "ping": {
          return {};
        }
        case "tools/list": {
          return {
            tools: [
              ...Object.entries(LOCAL_TOOLS)
                .filter(([name]) => !commandTools.has(name))
                .map(([name, tool]) => ({
                  name,
                  description: tool.description,
                  inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
                  annotations: { readOnlyHint: tool.readOnly },
                })),
              ...[...commandTools.values()].map((tool) => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                annotations: { readOnlyHint: tool.readOnly },
              })),
              ...(await upstreamTools).map((tool) => ({ ...tool, name: `${ENCORE}${tool.name}` })),
            ],
          };
        }
        case "tools/call": {
          return callTool(params);
        }
        case "resources/list": {
          return { resources: listLocalResources(knowledge()) };
        }
        case "resources/templates/list": {
          return { resourceTemplates: LOCAL_RESOURCE_TEMPLATES };
        }
        case "resources/read": {
          const uri = (params as { uri?: unknown } | undefined)?.uri;
          if (typeof uri !== "string")
            throw new McpProtocolError(-32_602, "resources/read needs a uri");
          return { contents: [readLocalResource(knowledge(), uri)] };
        }
        case "prompts/list": {
          return {
            prompts: Object.entries(LOCAL_PROMPTS).map(([name, prompt]) => ({
              name,
              title: prompt.title,
              description: prompt.description,
              arguments: promptArguments(prompt.input),
            })),
          };
        }
        case "prompts/get": {
          const { name, arguments: args } = (params ?? {}) as {
            name?: unknown;
            arguments?: unknown;
          };
          if (typeof name !== "string")
            throw new McpProtocolError(-32_602, "prompts/get needs a prompt name");
          return getLocalPrompt(knowledge(), name, args);
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
