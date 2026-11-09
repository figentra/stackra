/**
 * Stackra file contract:
 * Purpose: `TerminalLineKind`, what one recorded terminal line is: a typed command, printed output, a prompt, the
 *          answer chosen or a done line (`@stackra/ui`'s `TerminalLine["kind"]`).
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case and never shown as words.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); STA-2041.
 */
import { Enum } from "@stackra/contracts";

/** The kinds of a recorded terminal line. */
export const TerminalLineKind = Enum.of({
  /** Typed by the user. */
  Command: "command",
  /** Printed by the program. */
  Output: "output",
  /** A question the program asks. */
  Prompt: "prompt",
  /** The answer chosen. */
  Choice: "choice",
  /** A done line. */
  Success: "success",
});

/** One of the codes above. */
export type TerminalLineKind = Enum.Value<typeof TerminalLineKind>;
