/**
 * Stackra file contract:
 * Purpose: `ArgumentOptions`, what `@Argument(options)` takes on a command field bound to a positional token.
 * Boundary: a type only. The value kind comes from `@Str`, `@Int`, `@Num` or `@List`, never from here.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-002 to FR-004.
 */

/** The options of an argument field. */
export interface ArgumentOptions {
  /** Shown in the command's help. */
  readonly description?: string;

  /** The argument may be left out; needed only when the field has no initialiser, since the runtime cannot see `?`. */
  readonly optional?: boolean;

  /** The value is never kept: an audit entry writes `[redacted]` (STA-1731 FR-016). */
  readonly secret?: boolean;

  /** Asked through a prompt when the invocation leaves it out and the run is interactive (STA-1966 FR-018). */
  readonly prompt?: string;

  /** The only values it takes; a prompt for it is a select (a multiselect for a `@List` field). */
  readonly choices?: readonly string[];
}
