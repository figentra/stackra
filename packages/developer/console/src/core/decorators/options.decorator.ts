/**
 * Stackra file contract:
 * Purpose: `@Options(SomeOptionSet)`, the field decorator that gives a command the `@Option` fields of a shared
 *          `OptionSet`: they join the command's options (each listed once in its help), and the parsed values fill an
 *          instance of the set on this field.
 * Boundary: made with `createDecorator`, so it records the set and installs no accessor; it may mark commands only. A
 *           flag of the set that another option of the command also takes is a declaration error (`readCommand`).
 * Runtime: isomorphic
 * Governing contract: STA-2924 spec FR-001 to FR-003; ADR 0506.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import type { OptionSetClass } from "#core/types/option-set-class.type";

/** The recording decorator; `Options` gives it the set. */
const OPTIONS = createDecorator<OptionSetClass>({
  kind: "options",
  target: DecoratorTarget.Field,
  kinds: ["command"],
});

/**
 * Marks a field that holds the shared options of `set`.
 *
 * @example
 * ```ts
 * @Options(CheckOptionSet)
 * flags = new CheckOptionSet();
 * ```
 */
export function Options(set: OptionSetClass): (target: object, property: string) => void {
  return OPTIONS(set);
}

/** The option set recorded on each field of a class and its ancestors. */
Options.members = OPTIONS.members;
