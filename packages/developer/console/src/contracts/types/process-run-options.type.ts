/**
 * Stackra file contract:
 * Purpose: `ProcessRunOptions`, how one child process runs: its working directory and extra environment, whether it
 *          needs the terminal (keystrokes and visible progress, as `gh auth login`), and a listener for its output.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007, FR-028 and FR-029.
 */

/** How a child process runs. */
export interface ProcessRunOptions {
  /** The working directory; the run's `cwd` when absent. */
  readonly cwd?: string;

  /** Variables added to the run's environment. */
  readonly env?: Readonly<Record<string, string>>;

  /** The child inherits the terminal; its output is not captured. Refused when the run is not interactive. */
  readonly interactive?: boolean;

  /** Receives each chunk of captured output, standard output and standard error interleaved. */
  readonly onOutput?: (chunk: string) => void;
}
