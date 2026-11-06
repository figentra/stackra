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

  /**
   * `true`: the value is never kept, and an audit entry writes `[redacted]` (STA-1731 FR-016). `false`: not secret even
   * when the name ends like one (`key`, `url`); absent, the name decides.
   */
  readonly secret?: boolean;

  /** Asked through a prompt when the invocation leaves it out and the run is interactive (STA-1966 FR-018). */
  readonly prompt?: string;

  /** The only values it takes; a prompt for it is a select (a multiselect for a `@List` field). */
  readonly choices?: readonly string[];
}
