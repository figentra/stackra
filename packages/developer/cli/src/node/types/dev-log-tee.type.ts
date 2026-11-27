/**
 * Stackra file contract:
 * Purpose: `DevLogTee`, the copy of one dev tool run's output `stackra dev` keeps in the dev log: `write` takes each
 *          chunk the tool prints, by stream; `end` writes the last partial lines and the end line with the exit code.
 * Boundary: type only; `devLogTee` builds it and `toolCommand("dev")` hands `write` to `runProcess` as its tee.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0296 (decision 1); STA-2889.
 */

/** The tee of one dev tool run. */
export type DevLogTee = {
  /** Takes a chunk the tool printed on `stream`. */
  readonly write: (stream: "stdout" | "stderr", text: string) => void;

  /** Writes the last partial lines and the end line with the exit code. */
  readonly end: (exitCode: number | undefined) => void;
};
