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
import { TextRendererDriver } from "#core/drivers/text-renderer.driver";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { SYMBOLS } from "#core/constants/symbols.constant";
import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
import { UsageError } from "#core/errors/usage.error";
import { buildRegistry } from "#core/functions/build-registry.function";
import { createOutput } from "#core/functions/create-output.function";
import { createPainter } from "#core/functions/create-painter.function";
import { createProcess } from "#core/functions/create-process.function";
import { createPrompt } from "#core/functions/create-prompt.function";
import { decideGround } from "#core/functions/decide-ground.function";
import { decideMode } from "#core/functions/decide-mode.function";
import { defaultsPrompter } from "#core/functions/defaults-prompter.function";
import { errorCode } from "#core/functions/error-code.function";
import { isSecret } from "#core/functions/is-secret.function";
import { problemOf } from "#core/functions/problem-of.function";
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
    const context = {
      mode,
      theme,
      version: config.version,
      stdout: ports.stdout,
      stderr: ports.stderr,
    };
    const renderer = ports.renderer?.(context) ?? new TextRendererDriver(context);
    let data: unknown;
    let rows: readonly unknown[] | undefined;
    let failed = false;
    let wrote = false;
    const output = createOutput({
      mode,
      renderer,
      onJson: (value) => {
        data = value;
      },
      onRows: (given) => {
        rows = given;
      },
      onFailed: () => {
        failed = true;
      },
      onWrite: () => {
        wrote = true;
      },
    });
    const painter = createPainter(mode.depth, theme.accent);
    const finish = (code: number, error?: unknown, docs?: string): number => {
      if (mode.json) {
        const problem = error === undefined ? undefined : problemOf(error, docs);
        // A non-zero code without an error still carries the data (a failed checklist, a returned code).
        const document =
          problem === undefined
            ? { ok: code === EXIT_CODE.success, data: data ?? rows ?? null }
            : {
                ok: false,
                error: {
                  code: errorCode(error),
                  message: problem.title,
                  ...(problem.why === undefined ? {} : { why: problem.why }),
                  ...(problem.fix === undefined ? {} : { fix: problem.fix }),
                  ...(problem.docs === undefined ? {} : { docs: problem.docs }),
                },
              };
        ports.stdout.write(`${JSON.stringify(document)}\n`);
      } else if (error !== undefined) renderer.problem(problemOf(error, docs), mode.verbose);
      return code;
    };

    if (intent.kind === "usage") return finish(EXIT_CODE.usage, intent.error);
    if (intent.kind === "version") {
      data = { name: config.name, version: config.version };
      if (!mode.json) renderer.about();
      return finish(EXIT_CODE.success);
    }
    if (intent.kind === "list") {
      const visible = [...new Set(registry.values())]
        .map((row) => row.structure)
        .filter((structure) => !structure.hidden);
      data = visible;
      if (!mode.json) {
        // The banner carries the name and version on a terminal; a pipe gets them as a plain line.
        if (mode.tty) renderer.banner();
        else {
          renderer.about();
          renderer.line();
        }
        renderer.commandList(visible, config.name);
      }
      return finish(EXIT_CODE.success);
    }
    if (intent.kind === "help") {
      data = intent.entry.structure;
      if (!mode.json) renderer.help(intent.entry.structure, config.name);
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
    // A secret option's value never reaches captured child output, an error or a log.
    const secrets = [...entry.structure.arguments, ...entry.structure.options]
      .filter(isSecret)
      .map((field) => intent.values[field.property])
      .filter((value): value is string => typeof value === "string" && value !== "");
    const children = createProcess({
      ...(ports.process === undefined ? {} : { runner: ports.process() }),
      mode,
      cwd: ports.cwd,
      echo: (chunk) => {
        if (!mode.json) ports.stderr.write(painter.dim(chunk));
      },
      redact: (text) =>
        secrets.reduce((kept, secret) => kept.replaceAll(secret, "[redacted]"), text),
    });
    const outcome = await runCommand(
      entry,
      intent.values,
      config,
      ports.signals,
      (signal) => ({
        output,
        prompt: createPrompt(prompter),
        process: children,
        cwd: ports.cwd,
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
    // Data the command returned without writing anything is presented by its shape.
    if (!mode.json && !wrote && outcome.error === undefined && outcome.data !== undefined)
      output.present(outcome.data);
    const code =
      outcome.error === undefined && failed && outcome.code === EXIT_CODE.success && !outcome.coded
        ? EXIT_CODE.failure
        : outcome.code;
    return finish(code, outcome.error, entry.structure.docs);
  };

  return { run };
}
