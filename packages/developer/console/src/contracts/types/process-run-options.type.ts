/**
 * Stackra file contract:
 * Purpose: `ProcessRunOptions`, how one child process runs: its working directory and extra environment, whether it
 *          needs the terminal (keystrokes and visible progress, as `gh auth login`), whether it shares the standard
 *          streams, and a listener for its output.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007, FR-028 and FR-029; ADR 0506 (amendment 2026-11-03).
 */

/** How a child process runs. */
export interface ProcessRunOptions {
  /** The working directory; the run's `cwd` when absent. */
  readonly cwd?: string;

  /** Variables added to the run's environment. */
  readonly env?: Readonly<Record<string, string>>;

  /**
   * The child inherits the terminal; its output is not captured. Refused when the run is not interactive, and by
   * `io.process` while the run holds a secret value. `inherit: "stderr"` wins over it.
   */
  readonly interactive?: boolean;

  /**
   * The child shares the standard streams: its output is live, not captured and not redacted, and it is never refused
   * for want of a terminal. `"stderr"`: standard input is ignored and both outputs go to standard error, as under
   * `--json`. `io.process` refuses it while the run holds a secret value.
   */
  readonly inherit?: boolean | "stderr";

  /** Receives each chunk of captured output, standard output and standard error interleaved, secrets redacted. */
  readonly onOutput?: (chunk: string) => void;
}
