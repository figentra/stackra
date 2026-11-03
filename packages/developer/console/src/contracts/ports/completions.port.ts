/**
 * Stackra file contract:
 * Purpose: the `Completions` port: the bash, zsh or fish script that wires Tab to a CLI, and the candidates for a
 *          partial command line (commands, spaced subcommands, options and choice values), both from the commands'
 *          definitions.
 * Boundary: an abstract class that is its own token; returns text and data and writes nothing. The kernel answers
 *           `<bin> completion <shell>` with the script and the script's `<bin> complete -- <words>` with candidates.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-001, FR-006 and AC-008.
 */
import { Port } from "@stackra/contracts";

import type { CommandStructure } from "#contracts/types/command-structure.type";
import type { CompletionCandidate } from "#contracts/types/completion-candidate.type";

/**
 * Completes command lines with Tab.
 *
 * @example
 * export class TabCompletionsDriver extends Driver(Completions) {
 *   script(shell: "bash" | "zsh" | "fish", binary: string): string {
 *     return scriptFor(shell, binary);
 *   }
 * }
 */
export abstract class Completions extends Port {
  /** The script that makes `shell` complete `binary` with Tab. */
  abstract script(
    shell: "bash" | "zsh" | "fish",
    binary: string,
    definitions: readonly CommandStructure[],
  ): string;

  /** The candidates for the last of `words` (the command line after the binary; the last may be empty). */
  abstract complete(
    words: readonly string[],
    definitions: readonly CommandStructure[],
  ): readonly CompletionCandidate[];
}
