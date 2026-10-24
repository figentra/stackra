/**
 * Stackra file contract:
 * Purpose: `PROCESS_IO`, the io of the `stackra` binary: this process's standard output and error, with tools
 *          inheriting the terminal so `dev` servers, watchers and prompts behave as if run directly.
 * Boundary: writes to this process's streams only.
 * Runtime: node
 * Governing contract: ADR 0083 (the `stackra` binary).
 */
import type { CliIo } from "#node/types/cli-io.type";

/** The binary's own streams. */
export const PROCESS_IO: CliIo = {
  out: (text) => void process.stdout.write(text),
  err: (text) => void process.stderr.write(text),
  inherit: true,
};
