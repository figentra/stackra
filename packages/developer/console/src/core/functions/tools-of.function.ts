/**
 * Stackra file contract:
 * Purpose: `toolsOf(config, ports)`, the local developer MCP tools of a console: one per command declared
 *          `tool: true`, with its JSON Schema from the definition, and an `invoke` that runs the command through the
 *          same kernel with `--json`, no terminal and no prompts, and resolves with that run's document. So a tool and
 *          its command share one schema and one handler, and `--json`, MCP and the test harness return the same data.
 * Boundary: no MCP SDK; `@stackra/mcp` serves the tools. Writes only to the streams it captures. Tenant tools stay on
 *           the action's own path (ADR 0155); a console tool is local developer tooling only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-020, FR-027 and AC-006; ADR 0282 decision 5.
 */
import { defaultsPrompter } from "#core/functions/defaults-prompter.function";
import { argvOf } from "#core/functions/argv-of.function";
import { buildRegistry } from "#core/functions/build-registry.function";
import { createConsole } from "#core/functions/create-console.function";
import { errorCode } from "#core/functions/error-code.function";
import { jsonSchemaOf } from "#core/functions/json-schema-of.function";
import type { ConsoleConfig } from "#core/types/console-config.type";
import type { ConsoleTool } from "#core/types/console-tool.type";
import type { ToolPorts } from "#core/types/tool-ports.type";

/**
 * The local MCP tools of the console `config` describes, run against `ports`.
 *
 * @example
 * serveLocalMcp({ version, tools: toolsOf(STACKRA_CONSOLE, { cwd: root, process: () => new NodeProcessRunnerDriver() }) });
 */
export function toolsOf(config: ConsoleConfig, ports: ToolPorts): ConsoleTool[] {
  const app = createConsole(config);
  const structures = [...new Set(buildRegistry(config.commands).values())].map(
    (entry) => entry.structure,
  );
  return structures.flatMap((structure) => {
    if (structure.tool === undefined) return [];
    return [
      {
        name: structure.name.replaceAll(":", "_"),
        description: structure.description,
        inputSchema: jsonSchemaOf(structure),
        readOnly: structure.tool.readOnly,
        invoke: async (input) => {
          let argv: string[];
          try {
            argv = argvOf(structure, input);
          } catch (error) {
            const message = (error as Error).message;
            return {
              document: { ok: false, error: { code: errorCode(error), message } },
              exitCode: 2,
            };
          }
          let stdout = "";
          const exitCode = await app.run(
            [argv[0] ?? structure.name, "--json", "--no-interaction", ...argv.slice(1)],
            {
              stdout: {
                write: (text) => {
                  stdout += text;
                },
              },
              stderr: { write: () => undefined },
              stdoutIsTTY: false,
              stdinIsTTY: false,
              env: ports.env ?? {},
              cwd: ports.cwd,
              columns: ports.columns ?? 100,
              signals: { on: () => () => undefined },
              prompter: () => defaultsPrompter(),
              ...(ports.process === undefined ? {} : { process: ports.process }),
              ...(ports.completions === undefined ? {} : { completions: ports.completions }),
            },
          );
          return { document: JSON.parse(stdout) as Record<string, unknown>, exitCode };
        },
      },
    ];
  });
}
