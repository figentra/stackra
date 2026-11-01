/**
 * Stackra file contract:
 * Purpose: `@Argument(options?)`, the field decorator that binds a command field to the next positional token.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; it may mark commands
 *           only. Written bare (`@Argument`) when it has no options.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-002 and FR-004; ADR 0294 (decision 6).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import type { ArgumentOptions } from "#contracts/types/argument-options.type";

/** The recording decorator; `Argument` gives it its options. */
const ARGUMENT = createDecorator<ArgumentOptions>({
  kind: "argument",
  target: DecoratorTarget.Field,
  kinds: ["command"],
});

/**
 * Marks a positional field. Arguments bind in field order; a `@List` argument must be last and takes the rest.
 *
 * @example
 * ```ts
 * @Argument({ description: "The tenant's slug" })
 * tenant!: string;
 * ```
 */
export function Argument(options?: ArgumentOptions): (target: object, property: string) => void;
/** The bare form: `@Argument` with no options. */
export function Argument(target: object, property: string): void;
/** Implementation of both forms: records `options` on the field, or `{}` when written bare. */
export function Argument(options: ArgumentOptions | object = {}, property?: string): unknown {
  if (property !== undefined) return ARGUMENT({})(options, property);
  return ARGUMENT(options as ArgumentOptions);
}

/** The options recorded on each field of a class and its ancestors. */
Argument.members = ARGUMENT.members;
