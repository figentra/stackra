/**
 * Stackra file contract:
 * Purpose: `OptionOptions`, what `@Option(options)` takes on a command field bound to `--<kebab-name>`.
 * Boundary: a type only. The value kind comes from `@Str`, `@Int`, `@Num` or `@List`; with none, a boolean.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-002 and FR-003.
 */

/** The options of an option field. */
export interface OptionOptions {
  /** One letter, written `-<short>`. */
  readonly short?: string;

  /** Shown in the command's help. */
  readonly description?: string;
}
