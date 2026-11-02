/**
 * Stackra file contract:
 * Purpose: `ConsolePorts`, the side effects one run receives: the streams, whether they are terminals, the
 *          environment, the width, the signal source, the interactive prompter and the renderer.
 * Boundary: a type only; `nodePorts()` binds them to the process and `./testing` to memory. In core, not contracts,
 *           because the prompter is drawn with core's `PromptPaint`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012, FR-020 to FR-023; STA-1966 spec FR-001.
 */
import type { Renderer } from "#contracts/ports/renderer.port";
import type { Prompter } from "#contracts/types/prompter.type";
import type { SignalSource } from "#contracts/types/signal-source.type";
import type { WritableText } from "#contracts/types/writable-text.type";
import type { PromptPaint } from "#core/types/prompt-paint.type";
import type { RenderContext } from "#core/types/render-context.type";

/** What a run may touch. */
export interface ConsolePorts {
  /** Standard output. */
  readonly stdout: WritableText;

  /** Standard error. */
  readonly stderr: WritableText;

  /** Whether standard output is a terminal. */
  readonly stdoutIsTTY: boolean;

  /** Whether standard input is a terminal. */
  readonly stdinIsTTY: boolean;

  /** The environment. */
  readonly env: Readonly<Record<string, string | undefined>>;

  /** The terminal width in columns, when known. */
  readonly columns?: number;

  /** Where stop signals come from. */
  readonly signals: SignalSource;

  /** Makes the prompter of an interactive run, drawn with the run's colours and symbols. */
  readonly prompter: (paint: PromptPaint) => Prompter;

  /** Makes the run's renderer; the text driver when absent. */
  readonly renderer?: (context: RenderContext) => Renderer;
}
