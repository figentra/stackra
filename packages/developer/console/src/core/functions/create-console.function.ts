/**
 * Stackra file contract:
 * Purpose: `createConsole(config)`, a console: the registry is read and checked once (declarations, duplicate
 *          names), and `run(argv, ports)` routes the invocation to one intent, decides the mode, lists, helps, versions
 *          or dispatches, renders a
 *          failure as an error screen or a `--json` error (or, with `json: "bare"`, the data alone on stdout and
 *          everything else on stderr), and resolves with the exit code.
 * Boundary: no module's commands live here; they come in `config.commands`. Writes only to `ports`; the container
 *           factory is called only to dispatch a command.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-006 to FR-025; spec 030 Requirements 3 to 7; STA-1966 spec FR-012 to FR-016;
 *                     ADR 0506 (amendment 2026-11-03).
 */
import { EXIT_CODE } from "#core/constants/exit-code.constant";
import { TextRendererDriver } from "#core/drivers/text-renderer.driver";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { SYMBOLS } from "#core/constants/symbols.constant";
import { CommandError } from "#core/errors/command-error.error";
import { PromptCancelledError } from "#core/errors/prompt-cancelled.error";
import { UsageError } from "#core/errors/usage.error";
import { askMissing } from "#core/functions/ask-missing.function";
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
    const intent = route(argv, registry, { requireCommand: config.requireCommand === true });
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
    // Bare JSON: stdout holds the data alone, so the renderer draws as without --json, onto stderr.
    const bare = mode.json && config.json === "bare";
    const view = bare
      ? { ...context, mode: { ...mode, json: false }, stdout: ports.stderr }
      : context;
    const renderer = ports.renderer?.(view) ?? new TextRendererDriver(view);
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
      if (bare) {
        // An explicit `null` is data; only a run that gave none falls back to the rows.
        const value = data === undefined ? rows : data;
        if (error !== undefined) renderer.problem(problemOf(error, docs), mode.verbose);
        else if (value !== undefined) ports.stdout.write(`${JSON.stringify(value)}\n`);
      } else if (mode.json) {
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
    if (intent.kind === "completion" || intent.kind === "complete") {
      const completions = ports.completions?.();
      if (completions === undefined)
        return finish(
          EXIT_CODE.failure,
          new CommandError("Tab completion is not available here", {
            why: "no Completions driver is bound to this run",
            fix: "pass nodePorts() from @stackra/console/node",
          }),
        );
      const definitions = [...new Set(registry.values())].map((row) => row.structure);
      if (intent.kind === "completion") {
        const script = completions.script(intent.shell, config.name, definitions);
        data = { shell: intent.shell, script };
        if (!mode.json) ports.stdout.write(script);
        return finish(EXIT_CODE.success);
      }
      // The shell reads one `value<TAB>description` line per candidate, then the directive (4: no file completion).
      for (const { value, description } of completions.complete(intent.words, definitions))
        ports.stdout.write(`${value}\t${description}\n`);
      ports.stdout.write(":4\n");
      return EXIT_CODE.success;
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
    const prompt = createPrompt(prompter);
    let values: Readonly<Record<string, unknown>>;
    try {
      values = await askMissing(entry.structure, intent.values, prompt);
    } catch (error) {
      return finish(codeOf(error), error, entry.structure.docs);
    }
    // A secret option's value never reaches captured child output, an error or a log.
    const secrets = [...entry.structure.arguments, ...entry.structure.options]
      .filter(isSecret)
      // A list option holds several values, and a number is redacted by its digits.
      .flatMap((field) => [values[field.property]].flat())
      .map((value) => (typeof value === "number" ? String(value) : value))
      .filter((value): value is string => typeof value === "string" && value !== "");
    const children = createProcess({
      ...(ports.process === undefined ? {} : { runner: ports.process() }),
      mode,
      cwd: ports.cwd,
      secret: secrets.length > 0,
      echo: (chunk) => {
        // Bare JSON keeps stderr for people, so --verbose still shows the child there.
        if (!mode.json || bare) ports.stderr.write(painter.dim(chunk));
      },
      redact: (text) =>
        secrets.reduce((kept, secret) => kept.replaceAll(secret, "[redacted]"), text),
    });
    const outcome = await runCommand(
      entry,
      values,
      config,
      ports.signals,
      (signal) => ({
        output,
        prompt,
        process: children,
        cwd: ports.cwd,
        rest: intent.rest,
        stdout: ports.stdout,
        stderr: ports.stderr,
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
