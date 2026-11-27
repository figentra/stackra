/**
 * Stackra file contract:
 * Purpose: `route(argv, registry, options)`, the one intent of an invocation: the list (no name, `help` alone; a usage
 *          problem instead with `requireCommand`; `list`, and every command with `list --all`, when no command claims
 *          `list`), the version, a
 *          command's help (`--help`, `-h`, `help <cmd>`), a run with the parsed values, or a usage problem (an unknown
 *          or ambiguous name, with the closest names; a bad argument or option), a completion script
 *          (`completion <shell>`) or a completion script's question (`complete -- <words>`).
 * Boundary: pure; builds no command and no container, so help and version never run anything. A value option may come
 *           before the name only when every command that declares its flag gives it a value.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-006 and FR-012 to FR-016; ADR 0506 (amendment 2026-11-03); STA-2872 spec FR-003.
 */
import { COMPLETE_COMMAND } from "#core/constants/complete-command.constant";
import { COMPLETION_COMMAND } from "#core/constants/completion-command.constant";
import { HELP_COMMAND } from "#core/constants/help-command.constant";
import { LIST_ALL_FLAG } from "#core/constants/list-all-flag.constant";
import { LIST_COMMAND } from "#core/constants/list-command.constant";
import { SHELLS } from "#core/constants/shells.constant";
import { UsageError } from "#core/errors/usage.error";
import { findCommand } from "#core/functions/find-command.function";
import { parseInvocation } from "#core/functions/parse-invocation.function";
import { splitInvocation } from "#core/functions/split-invocation.function";
import type { CommandEntry } from "#core/types/command-entry.type";
import type { RouteDecision } from "#core/types/route-decision.type";

/** Whether each `--flag` and `-f` of `registry` takes a value in every command that declares it. */
function valueFlagsOf(registry: ReadonlyMap<string, CommandEntry>): ReadonlyMap<string, boolean> {
  const takes = new Map<string, boolean>();
  for (const { structure } of new Set(registry.values()))
    for (const field of structure.options)
      for (const token of [
        `--${field.flag}`,
        ...(field.short === undefined ? [] : [`-${field.short}`]),
      ])
        takes.set(token, (takes.get(token) ?? true) && field.kind !== "boolean");
  return takes;
}

/**
 * Decides what `argv` (without the node and script paths) asks of `registry`.
 *
 * @example
 * route(["help", "mcp", "sync"], registry); // { kind: "help", entry: <mcp:sync>, globals }
 */
export function route(
  argv: readonly string[],
  registry: ReadonlyMap<string, CommandEntry>,
  options: { readonly requireCommand?: boolean } = {},
): RouteDecision {
  const known = (name: string) => registry.has(name);
  const takes = valueFlagsOf(registry);
  const valueFlag = (token: string) => takes.get(token) === true;
  let { name: typed, rest, raw } = splitInvocation(argv, known, valueFlag);
  if (typed === COMPLETE_COMMAND) {
    // What a completion script sends after `--` is the line being typed, kept as it is.
    const dash = rest.indexOf("--");
    return {
      kind: "complete",
      globals: parseInvocation([]).globals,
      words: dash < 0 ? rest : rest.slice(dash + 1),
    };
  }
  if (typed === COMPLETION_COMMAND) {
    const [shell, ...others] = rest;
    const parsed = parseInvocation(others);
    const named = SHELLS.find((name) => name === shell);
    return named === undefined
      ? {
          kind: "usage",
          globals: parsed.globals,
          error: new UsageError(
            shell === undefined ? "Name a shell" : `There is no completion script for "${shell}"`,
            `Run with one of: ${SHELLS.join(", ")}`,
          ),
        }
      : { kind: "completion", globals: parsed.globals, shell: named };
  }
  let asked = false;
  if (typed === HELP_COMMAND) {
    asked = true;
    ({ name: typed, rest, raw } = splitInvocation(rest, known, valueFlag));
  }
  if (typed === LIST_COMMAND && !known(LIST_COMMAND)) {
    // The built-in list: `--all` is its one option; an argument or another option is a usage problem.
    const parsed = parseInvocation(rest.filter((token) => token !== LIST_ALL_FLAG));
    if (parsed.error !== undefined)
      return { kind: "usage", globals: parsed.globals, error: parsed.error };
    if (parsed.globals.version) return { kind: "version", globals: parsed.globals };
    return { kind: "list", globals: parsed.globals, all: rest.includes(LIST_ALL_FLAG) };
  }
  let entry: CommandEntry | undefined;
  try {
    entry = typed === undefined ? undefined : findCommand(typed, registry);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    return { kind: "usage", globals: parseInvocation(rest).globals, error };
  }
  if (entry?.structure.passthrough === true) {
    // Migration only: the command parses its own flags; the kernel keeps only `--help` before `--`.
    const head = raw.includes("--") ? raw.slice(0, raw.indexOf("--")) : raw;
    const globals = {
      ...parseInvocation([]).globals,
      help: asked || head.includes("--help") || head.includes("-h"),
    };
    return globals.help
      ? { kind: "help", globals, entry }
      : { kind: "run", globals, entry, values: {}, rest: raw };
  }
  const parsed = parseInvocation(rest, entry?.structure);
  const { globals } = parsed;
  // `help <cmd>` reads like `<cmd> --help`: a missing required argument is no error there.
  const help = asked || globals.help;
  if (parsed.error !== undefined && !(help && entry !== undefined))
    return { kind: "usage", globals, error: parsed.error };
  if (globals.version) return { kind: "version", globals };
  if (entry === undefined)
    return help || options.requireCommand !== true
      ? { kind: "list", globals, all: false }
      : {
          kind: "usage",
          globals,
          error: new UsageError("Name a command", "Run with --help to see the commands"),
        };
  if (help) return { kind: "help", globals, entry };
  return { kind: "run", globals, entry, values: parsed.values, rest: [] };
}
