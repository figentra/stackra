/**
 * Stackra file contract:
 * Purpose: `TabCompletionsDriver`, the `Completions` of Bombshell Tab (`@bomb.sh/tab`): each visible command becomes a
 *          Tab command under its spaced name (`mcp:sync` as `mcp sync`), with its options, the global options, and
 *          choice values for an option or argument that has them.
 * Boundary: node only. Tab prints what it produces with `console.log`, so each synchronous call here captures that
 *           output and returns it, and nothing reaches the process's stdout.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-006 and AC-008; ADR 0506 (amendment of 2026-11-02, decision 1).
 */
import { type Command, RootCommand } from "@bomb.sh/tab";
import { Driver } from "@stackra/container";

import { Completions } from "#contracts/ports/completions.port";
import type { CommandField } from "#contracts/types/command-field.type";
import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { CompletionCandidate } from "#contracts/types/completion-candidate.type";
import { COMPLETION_COMMAND } from "#core/constants/completion-command.constant";
import { GLOBAL_OPTIONS } from "#core/constants/global-options.constant";
import { HELP_COMMAND } from "#core/constants/help-command.constant";
import { SHELLS } from "#core/constants/shells.constant";

/** The lines `work` prints through `console.log`, which Tab uses for all its output. */
function printed(work: () => void): string[] {
  const lines: string[] = [];
  // oxlint-disable-next-line no-console -- reason: Tab prints only through console.log; this captures it for the run's stream
  const original = console.log;
  // oxlint-disable-next-line no-console -- reason: Tab prints only through console.log; this captures it for the run's stream
  console.log = (...parts: unknown[]) => {
    lines.push(parts.map(String).join(" "));
  };
  try {
    work();
  } finally {
    // oxlint-disable-next-line no-console -- reason: Tab prints only through console.log; this captures it for the run's stream
    console.log = original;
  }
  return lines;
}

/** Completes the choices of `field`. */
const choose =
  (field: CommandField) => (complete: (value: string, description: string) => void) => {
    for (const choice of field.choices ?? []) complete(choice, field.description ?? "");
  };

/** Gives `command` the global options, which every command takes. */
function addGlobals(command: Command): void {
  for (const [flag, option] of Object.entries(GLOBAL_OPTIONS))
    command.option(
      flag === "interaction" ? "no-interaction" : flag,
      option.description,
      ...(option.short === undefined ? [] : [option.short]),
    );
}

/** A Tab tree of `definitions`. */
function treeOf(definitions: readonly CommandStructure[]): RootCommand {
  const root = new RootCommand();
  addGlobals(root);
  root.command(HELP_COMMAND, "Show a command's help");
  root
    .command(COMPLETION_COMMAND, "Print the shell script that completes commands with Tab")
    .argument("shell", (complete) => {
      for (const shell of SHELLS) complete(shell, `the ${shell} script`);
    });
  for (const definition of definitions) {
    if (definition.hidden) continue;
    const command = root.command(definition.name.replaceAll(":", " "), definition.description);
    addGlobals(command);
    for (const field of definition.options)
      if (field.kind === "boolean")
        command.option(
          field.flag,
          field.description ?? "",
          ...(field.short === undefined ? [] : [field.short]),
        );
      else
        command.option(
          field.flag,
          field.description ?? "",
          choose(field),
          ...(field.short === undefined ? [] : [field.short]),
        );
    for (const field of definition.arguments)
      command.argument(
        field.flag,
        field.choices === undefined ? undefined : choose(field),
        field.list,
      );
  }
  return root;
}

/** Completes command lines through Bombshell Tab. */
export class TabCompletionsDriver extends Driver(Completions) {
  /** Returns the script that makes `shell` complete `binary` with Tab. */
  script(
    shell: "bash" | "zsh" | "fish",
    binary: string,
    definitions: readonly CommandStructure[],
  ): string {
    const root = treeOf(definitions);
    return `${printed(() => root.setup(binary, binary, shell)).join("\n")}\n`;
  }

  /** Returns the candidates for the last of `words`. */
  complete(
    words: readonly string[],
    definitions: readonly CommandStructure[],
  ): readonly CompletionCandidate[] {
    const root = treeOf(definitions);
    return printed(() => root.parse([...words]))
      .filter((line) => !line.startsWith(":"))
      .map((line) => {
        const [value = "", ...description] = line.split("\t");
        return { value, description: description.join("\t") };
      });
  }
}
