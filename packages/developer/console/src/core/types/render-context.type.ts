/**
 * Stackra file contract:
 * Purpose: `RenderContext`, what a Renderer driver is built around for one run: the decided mode, the theme, the
 *          CLI's version and the run's two streams.
 * Boundary: a type only. A driver reads the mode and never the terminal or the environment.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-001 and FR-002.
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import type { WritableText } from "#contracts/types/writable-text.type";
import type { ConsoleMode } from "#core/types/console-mode.type";

/** One run, as a renderer sees it. */
export interface RenderContext {
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
}
