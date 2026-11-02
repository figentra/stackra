/**
 * Stackra file contract:
 * Purpose: `OutputSetup`, the inputs of one run's `ConsoleOutput`: the run's `Renderer`, the decided mode, and what the
 *          kernel hears back (the `--json` data, rows given to a table or checklist, a failed checklist row, and
 *          whether the command wrote anything).
 * Boundary: a type only; built by the kernel for each run.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018 and FR-022; STA-1966 spec FR-009, FR-021 and FR-030.
 */
import type { Renderer } from "#contracts/ports/renderer.port";
import type { ConsoleMode } from "#core/types/console-mode.type";

/** The inputs of one run's output. */
export interface OutputSetup {
  /** The decided mode. */
  readonly mode: ConsoleMode;

  /** What draws. */
  readonly renderer: Renderer;

  /** Receives the data of `json(data)` under `--json`. */
  readonly onJson: (data: unknown) => void;

  /** Receives the rows of a table or checklist, the `--json` data when the command sets none. */
  readonly onRows?: (rows: readonly unknown[]) => void;

  /** Called when a checklist has a failed row. */
  readonly onFailed?: () => void;

  /** Called on the first write, so data the command returns is presented only when it wrote nothing. */
  readonly onWrite?: () => void;
}
