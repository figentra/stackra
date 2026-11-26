/**
 * Stackra file contract:
 * Purpose: `Diagnostic`, one compiler, linter or gen finding a tool read from a command's output: where it is, how
 *          bad it is, its code and its message.
 * Boundary: type only; `parseDiagnostics` and `parseGenOutput` build them.
 * Runtime: node
 * Governing contract: STA-2873.
 */

/** One finding at a place in a file. */
export type Diagnostic = {
  /** The file, as the tool printed it (relative to where it ran). */
  readonly file: string;
  /** The 1-based line, when the tool gave one. */
  readonly line?: number;
  /** The 1-based column, when the tool gave one. */
  readonly column?: number;
  /** `error` fails the run; `warning` does not. */
  readonly severity: "error" | "warning";
  /** The rule or code (`TS2322`, `eslint(no-unused-vars)`, `migration_compile_failed`). */
  readonly code?: string;
  /** The tool's message for it. */
  readonly message: string;
  /** The fix the tool suggested, when it gave one. */
  readonly fix?: string;
};
