/**
 * Stackra file contract:
 * Purpose: `ActionCommand(Action, Input, options)`, the console command of one action or query: a `Command` class
 *          whose options are the input schema's fields (kind and bounds from `@Str`, `@Int`, `@Num`, `@List`), and whose
 *          `handle` runs the call through `ActionPipeline` as the `CommandActor`, returning the output (`--json`
 *          emits it unchanged).
 * Boundary: gen emits `class <Action>Command extends ActionCommand(...) {}`; nothing else calls it. Fields come from
 *           the decorators on the input class, and from its registered schema when there is one (a flag with no
 *           decorator, a required field). The CLI never runs as a privileged operator: no `CommandActor`, or no
 *           signed-in actor, refuses the run before the action starts. A pipeline refusal is rethrown as it is; the
 *           console renders its message and exits 1.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-022, FR-026, FR-027; ADR 0506 (amendment of 2026-11-02, point 7); ADR 0305
 *                     (rule 28).
 */
import type { AnyClass } from "@stackra/container";
import { Command, Option, UsageError } from "@stackra/console";
import { Int, List, Num, Str, schemaOf } from "@stackra/validation";

import type { CommandActor } from "#contracts/ports/command-actor.port";
import type { Action } from "#core/bases/action.base";
import type { Query } from "#core/bases/query.base";
import type { ActionPipeline } from "#core/services/action-pipeline.service";
import type { ActionCommandOptions } from "#node/types/action-command-options.type";

/** A decorator factory taking the recorded options, as `Int`, `Num`, `Str` and `List` are used here. */
type Recorder = (options: unknown) => (target: object, property: string) => void;

/** The validation decorators that describe a value, with the field options each recorded. */
const VALUE_DECORATORS: readonly [
  { members: (type: never) => ReadonlyMap<string | symbol, unknown> },
  Recorder,
][] = [
  [Int, Int as unknown as Recorder],
  [Num, Num as unknown as Recorder],
  [Str, Str as unknown as Recorder],
  [List, List as unknown as Recorder],
];

/** `dryRun` → `dry-run`. */
const kebab = (property: string) =>
  property.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** The required field names of `input`'s registered schema, and every field it names; empty when none is registered. */
function schemaFields(input: AnyClass): { all: string[]; required: Set<string> } {
  try {
    const shape = (
      schemaOf(input) as unknown as { shape?: Record<string, { isOptional: () => boolean }> }
    ).shape;
    const entries = Object.entries(shape ?? {});
    return {
      all: entries.map(([property]) => property),
      required: new Set(
        entries.filter(([, field]) => !field.isOptional()).map(([property]) => property),
      ),
    };
  } catch {
    // shortcut: an input with no registered schema gets decorated fields only and no required check; the pipeline still validates the input
    return { all: [], required: new Set() };
  }
}

/**
 * The command class of `action`, taking `input`'s fields as options.
 *
 * @example
 * export class CancelOrderCommand extends ActionCommand(CancelOrderAction, CancelOrderInput, { name: "order:cancel" }) {}
 */
export function ActionCommand(
  action: AnyClass<Action | Query>,
  input: AnyClass,
  options: ActionCommandOptions,
): new (
  pipeline: ActionPipeline,
  actor?: CommandActor,
) => { readonly "~kind": "command"; handle: () => Promise<unknown> } {
  const schema = schemaFields(input);
  const fields = new Set<string>(schema.all);
  for (const [decorator] of VALUE_DECORATORS)
    for (const property of decorator.members(input as never).keys()) fields.add(String(property));

  class Generated extends Command({
    name: options.name,
    description: options.description ?? `Runs ${options.name}`,
  }) {
    constructor(
      private readonly pipeline: ActionPipeline,
      private readonly actor?: CommandActor,
    ) {
      super();
    }

    async handle(): Promise<unknown> {
      const values: Record<string, unknown> = {};
      for (const property of fields) {
        const value = (this as unknown as Record<string, unknown>)[property];
        if (value !== undefined) values[property] = value;
      }
      // shortcut: a missing required field is refused here; prompts arrive with the console stack (STA-1966 PR 6)
      for (const property of schema.required)
        if (values[property] === undefined)
          throw new UsageError(
            `Missing --${kebab(property)}`,
            `${options.name} needs --${kebab(property)}`,
          );
      const actor = await this.actor?.current();
      if (actor === undefined) throw new Error(`Sign in to run ${options.name}`);
      return this.pipeline.execute(action, values as never, { actor });
    }
  }

  for (const property of fields) {
    Option({})(Generated.prototype, property);
    for (const [decorator, record] of VALUE_DECORATORS) {
      const recorded = decorator.members(input as never).get(property);
      if (recorded !== undefined) record(recorded)(Generated.prototype, property);
    }
  }
  return Generated;
}
