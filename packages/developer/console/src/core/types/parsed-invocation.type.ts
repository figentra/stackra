/**
 * Stackra file contract:
 * Purpose: `ParsedInvocation`, an argument vector split into the command name the Operator typed, the global options
 *          and the parsed field values (by class field), or the usage error the parse found.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-009, FR-010 and FR-015.
 */
import type { UsageError } from "#core/errors/usage.error";
import type { GlobalFlags } from "#core/types/global-flags.type";

/** One invocation, parsed. */
export interface ParsedInvocation {
  /** The global options; parsed even when the rest fails, so `--json` still shapes the error. */
  readonly globals: GlobalFlags;

  /** The given values by class field; only fields the Operator gave. */
  readonly values: Readonly<Record<string, unknown>>;

  /** The first problem found, when there is one. */
  readonly error?: UsageError;
}
