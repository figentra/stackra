/**
 * Stackra file contract:
 * Purpose: `createConsole(config)`, a console: the registry is read and checked once (declarations, duplicate
 *          names), and `run(argv, ports)` routes the invocation to one intent, decides the mode, lists, helps, versions
 *          or dispatches, renders a
 *          failure as an error screen or a `--json` error, and resolves with the exit code.
 * Boundary: no module's commands live here; they come in `config.commands`. Writes only to `ports`; the container
 *           factory is called only to dispatch a command.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006 to FR-025; spec 030 Requirements 3 to 7; STA-1966 spec FR-012 to FR-016.
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
import { decideGround } from "#core/functions/decide-ground.function";
import { decideMode } from "#core/functions/decide-mode.function";
import { defaultsPrompter } from "#core/functions/defaults-prompter.function";
import { errorCode } from "#core/functions/error-code.function";
import { renderError } from "#core/functions/render-error.function";
import { renderHelp } from "#core/functions/render-help.function";
import { renderList } from "#core/functions/render-list.function";
import { route } from "#core/functions/route.function";
import { runCommand } from "#core/functions/run-command.function";
import { visualBidi } from "#core/functions/visual-bidi.function";
import type { ConsoleApp } from "#core/types/console-app.type";
import type { ConsoleConfig } from "#core/types/console-config.type";
import type { ConsolePorts } from "#core/types/console-ports.type";

/** Who runs the command, for an audit entry: `STACKRA_OPERATOR`, else the login the environment names. */
const operatorOf = (env: ConsolePorts["env"]) =>
  [env["STACKRA_OPERATOR"], env["USER"], env["LOGNAME"], env["USERNAME"]].find(
    (name) => name !== undefined && name !== "",
  ) ?? "unknown";

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
  const baseTheme = config.theme ?? STACKRA_THEME;

  const run = async (argv: readonly string[], ports: ConsolePorts): Promise<number> => {
    const intent = route(argv, registry);
    const mode = decideMode(ports, intent.globals);
    const theme =
      baseTheme.dark !== undefined && decideGround(ports.env) === "dark"
        ? { ...baseTheme, ...baseTheme.dark }
        : baseTheme;
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

    if (intent.kind === "usage") return finish(EXIT_CODE.usage, intent.error);
    if (intent.kind === "version") {
      data = { name: config.name, version: config.version };
      if (!mode.json) write([`${painter.bold(theme.name)} ${painter.success(config.version)}`]);
      return finish(EXIT_CODE.success);
    }
    if (intent.kind === "list") {
      data = [...new Set(registry.values())]
        .filter((row) => !row.structure.hidden)
        .map((row) => row.structure);
      if (!mode.json) {
        // The banner carries the name and version on a terminal; a pipe gets them as a plain line.
        if (mode.tty) output.banner();
        else write([`${theme.name} ${config.version}`, ""]);
        write(renderList([...registry.values()], config.name, painter));
      }
      return finish(EXIT_CODE.success);
    }
    if (intent.kind === "help") {
      data = intent.entry.structure;
      if (!mode.json) write(renderHelp(intent.entry.structure, config.name, painter));
      return finish(EXIT_CODE.success);
    }
    const { entry } = intent;

    const prompter = mode.interactive
      ? ports.prompter({
          painter,
          symbols: SYMBOLS[mode.unicode ? "unicode" : "ascii"],
          bidi: mode.bidi === "visual" ? visualBidi : (text) => text,
        })
      : defaultsPrompter();
    const operator = operatorOf(ports.env);
    const outcome = await runCommand(
      entry,
      intent.values,
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
        operator,
      }),
      codeOf,
      operator,
      ports.env["STACKRA_ENVIRONMENT"] === "production",
    );
    if (outcome.data !== undefined && data === undefined) data = outcome.data;
    return finish(outcome.code, outcome.error);
  };

  return { run };
}
