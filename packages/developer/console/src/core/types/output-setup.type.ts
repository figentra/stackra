/**
 * Stackra file contract:
 * Purpose: `OutputSetup`, what `createOutput` builds one run's output from: the mode, the theme, the version, the
 *          streams and where `json(data)` goes.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016 to FR-022.
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import type { WritableText } from "#contracts/types/writable-text.type";
import type { ConsoleMode } from "#core/types/console-mode.type";

/** The inputs of one run's output. */
export interface OutputSetup {
  /** The decided mode. */
  readonly mode: ConsoleMode;

  /** The product's look. */
  readonly theme: ConsoleTheme;

  /** The CLI's version, shown in the banner. */
  readonly version: string;

  /** Standard output. */
  readonly stdout: WritableText;

  /** Standard error. */
  readonly stderr: WritableText;

  /** Receives the data of `json(data)` under `--json`. */
  readonly onJson: (data: unknown) => void;
}
