/**
 * Stackra file contract:
 * Purpose: `@Option(options?)`, the field decorator that binds a command field to `--<kebab-name>` (and `-<short>`).
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; it may mark commands
 *           only. Written bare (`@Option`) when it has no options.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-002 and FR-003; ADR 0294 (decision 6).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import type { OptionOptions } from "#contracts/types/option-options.type";

/** The recording decorator; `Option` gives it its options. */
const OPTION = createDecorator<OptionOptions>({
  kind: "option",
  target: DecoratorTarget.Field,
  kinds: ["command"],
});

/**
 * Marks a named field. With no `@Str`, `@Int`, `@Num` or `@List` it is a boolean flag (`--force`, `--no-force`).
 *
 * @example
 * ```ts
 * @Option({ short: "c", description: "Rows per table" })
 * @Int({ min: 1 })
 * count = 10;
 * ```
 */
export function Option(options?: OptionOptions): (target: object, property: string) => void;
/** The bare form: `@Option` with no options. */
export function Option(target: object, property: string): void;
/** Implementation of both forms: records `options` on the field, or `{}` when written bare. */
export function Option(options: OptionOptions | object = {}, property?: string): unknown {
  if (property !== undefined) return OPTION({})(options, property);
  return OPTION(options as OptionOptions);
}

/** The options recorded on each field of a class and its ancestors. */
Option.members = OPTION.members;
