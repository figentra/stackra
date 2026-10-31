/**
 * Stackra file contract:
 * Purpose: `createConsole(config)`, a console: the registry is read and checked once (declarations, duplicate
 *          names), and `run(argv, ports)` parses, decides the mode, lists, helps, versions or dispatches, renders a
 *          failure as an error screen or a `--json` error, and resolves with the exit code.
 * Boundary: no module's commands live here; they come in `config.commands`. Writes only to `ports`; the container
 *           factory is called only to dispatch a command.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006 to FR-025; spec 030 Requirements 3 to 7.
 */
import { EXIT_CODE } from "#core/constants/exit-code.constant";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { SYMBOLS } from "#core/constants/symbols.constant";
import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
import { UsageError } from "#core/errors/usage.error";
import { buildRegistry } from "#core/functions/build-registry.function";
import { createOutput } from "#core/functions/create-output.function";
import { createPainter } from "#core/functions/create-painter.function";
import { createPrompt } from "#core/functions/create-prompt.function";
import { decideMode } from "#core/functions/decide-mode.function";
import { defaultsPrompter } from "#core/functions/defaults-prompter.function";
import { errorCode } from "#core/functions/error-code.function";
import { findCommand } from "#core/functions/find-command.function";
import { parseInvocation } from "#core/functions/parse-invocation.function";
import { renderError } from "#core/functions/render-error.function";
import { renderHelp } from "#core/functions/render-help.function";
import { renderList } from "#core/functions/render-list.function";
import { runCommand } from "#core/functions/run-command.function";
import { splitInvocation } from "#core/functions/split-invocation.function";
import type { CommandEntry } from "#core/types/command-entry.type";
import type { ConsoleApp } from "#core/types/console-app.type";
import type { ConsoleConfig } from "#core/types/console-config.type";
import type { ConsolePorts } from "#core/types/console-ports.type";
import type { ParsedInvocation } from "#core/types/parsed-invocation.type";

/** The exit code of a failure. */
const codeOf = (error: unknown) =>
  error instanceof PromptCancelledError
    ? EXIT_CODE.interrupted
    : error instanceof UsageError
      ? EXIT_CODE.usage
      : EXIT_CODE.failure;

/**
 * A console over `config.commands`.
 *
 * @throws DuplicateCommandError or ConsoleDeclarationError when the registry is wrong, before any run.
 * @example
 * const app = createConsole({ name: "acme", version: "1.0.0", commands: [GreetCommand] });
 * process.exitCode = await app.run(process.argv.slice(2), nodePorts());
 */
export function createConsole(config: ConsoleConfig): ConsoleApp {
  const registry = buildRegistry(config.commands);
  const theme = config.theme ?? STACKRA_THEME;

  const run = async (argv: readonly string[], ports: ConsolePorts): Promise<number> => {
    const { name: typed, rest } = splitInvocation(argv);
    let entry: CommandEntry | undefined;
    let parsed: ParsedInvocation;
    try {
      entry = typed === undefined ? undefined : findCommand(typed, registry);
      parsed = parseInvocation(rest, entry?.structure);
    } catch (error) {
      if (!(error instanceof UsageError)) throw error;
      parsed = { ...parseInvocation(rest), error };
    }
    const mode = decideMode(ports, parsed.globals);
    let data: unknown;
    const output = createOutput({
      mode,
      theme,
      version: config.version,
      stdout: ports.stdout,
      stderr: ports.stderr,
      onJson: (value) => {
        data = value;
      },
    });
    const painter = createPainter(mode.depth, theme.accent);
    const write = (lines: readonly string[]) => {
      if (!mode.quiet) for (const line of lines) ports.stdout.write(`${line}\n`);
    };
    const finish = (code: number, error?: unknown): number => {
      if (mode.json) {
        const document =
          error === undefined
            ? { ok: true, data: data ?? null }
            : {
                ok: false,
                error: {
                  code: errorCode(error),
                  message: error instanceof Error ? error.message : String(error),
                },
              };
        ports.stdout.write(`${JSON.stringify(document)}\n`);
      } else if (error !== undefined)
        for (const line of renderError(error, mode.verbose, painter, mode.depth > 0))
          ports.stderr.write(`${line}\n`);
      return code;
    };

    if (parsed.error !== undefined) return finish(EXIT_CODE.usage, parsed.error);
    if (parsed.globals.version) {
      data = { name: config.name, version: config.version };
      if (!mode.json) write([`${painter.bold(theme.name)} ${painter.success(config.version)}`]);
      return finish(EXIT_CODE.success);
    }
    if (entry === undefined) {
      data = [...new Set(registry.values())]
        .filter((row) => !row.structure.hidden)
        .map((row) => row.structure);
      if (!mode.json) {
        output.banner();
        write(renderList([...registry.values()], config.name, painter));
      }
      return finish(EXIT_CODE.success);
    }
    if (parsed.globals.help) {
      data = entry.structure;
      if (!mode.json) write(renderHelp(entry.structure, config.name, painter));
      return finish(EXIT_CODE.success);
    }

    const prompter = mode.interactive
      ? ports.prompter({ painter, symbols: SYMBOLS[mode.unicode ? "unicode" : "ascii"] })
      : defaultsPrompter();
    const outcome = await runCommand(
      entry,
      parsed.values,
      config,
      ports.signals,
      (signal) => ({
        output,
        prompt: createPrompt(prompter),
        signal,
        verbose: mode.verbose,
        json: mode.json,
        interactive: mode.interactive,
        animate: mode.animate,
      }),
      codeOf,
    );
    if (outcome.data !== undefined && data === undefined) data = outcome.data;
    return finish(outcome.code, outcome.error);
  };

  return { run };
}
