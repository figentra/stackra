/**
 * Stackra file contract:
 * Purpose: `ToolRun`, the one process a tool command starts: the program, its arguments, the directory it runs in,
 *          the variables it adds to the environment, its deadline, a tee that gets a copy of what it prints, and
 *          whether it draws an interactive screen on the terminal.
 * Boundary: type only; `resolveTool` builds it and `runProcess` starts it without a shell.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: tools read the configs gen writes into `.stackra/`).
 */

/** One tool process. */
export type ToolRun = {
  /** The program, found on `PATH` or in a `node_modules/.bin` above `cwd`. */
  readonly command: string;

  /** Its arguments; never parsed by a shell. */
  readonly args: readonly string[];

  /** The absolute directory it runs in. */
  readonly cwd: string;

  /** Variables added to the inherited environment (`STACKRA_DEV_SURFACE` for a local shell). */
  readonly env?: Readonly<Record<string, string>>;

  /** How long it may run before it is stopped and answers 124; no limit when omitted. */
  readonly timeoutMs?: number;

  /**
   * Gets a copy of every chunk the process prints, by stream (`stackra dev`'s dev log, STA-2889). With a tee the
   * output is piped even when the io inherits the terminal, and still reaches the io.
   */
  readonly tee?: (stream: "stdout" | "stderr", text: string) => void;

  /**
   * The tool draws an interactive screen when its stdout is a terminal (`expo start`: the QR code and the key menu;
   * `wrangler dev`: its hotkeys). With a tee and an io that inherits the terminal, its stdout stays the terminal and
   * only its stderr is piped and teed.
   */
  readonly screen?: boolean;
};
