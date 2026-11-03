/**
 * Stackra file contract:
 * Purpose: `RenderContext`, what a Renderer driver is built around for one run: the decided mode, the theme, the
 *          CLI's version and the run's two streams.
 * Boundary: an abstract class with declared fields only, so it is a constructor token gen accepts for a driver's
 *           constructor (ADR 0294 decision 17) while the kernel passes a plain object of this shape. A driver reads the
 *           mode and never the terminal or the environment.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-001 and FR-002.
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import type { WritableText } from "#contracts/types/writable-text.type";
import type { ConsoleMode } from "#core/types/console-mode.type";

/** One run, as a renderer sees it. */
export abstract class RenderContext {
  /** The decided mode. */
  declare readonly mode: ConsoleMode;

  /** The product's look. */
  declare readonly theme: ConsoleTheme;

  /** The CLI's version, shown in the banner. */
  declare readonly version: string;

  /** Standard output. */
  declare readonly stdout: WritableText;

  /** Standard error. */
  declare readonly stderr: WritableText;
}
