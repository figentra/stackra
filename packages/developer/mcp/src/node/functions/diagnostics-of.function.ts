/**
 * Stackra file contract:
 * Purpose: `diagnosticsOf(found)`, the diagnostics part of a tool result: the error and warning counts, and the
 *          findings themselves, at most `DIAGNOSTICS_LIMIT` of them, errors first, with `truncated` when some were left
 *          out.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: STA-2873.
 */
import type { Diagnostic } from "#node/types/diagnostic.type";

/** The most findings one tool result lists. */
const DIAGNOSTICS_LIMIT = 200;

/**
 * The counted, capped findings.
 *
 * @param found - every finding parsed from the output.
 * @example
 * diagnosticsOf([]); // { errors: 0, warnings: 0, diagnostics: [] }
 */
export function diagnosticsOf(found: readonly Diagnostic[]): {
  readonly errors: number;
  readonly warnings: number;
  readonly diagnostics: readonly Diagnostic[];
  readonly truncated?: true;
} {
  const errors = found.filter((diagnostic) => diagnostic.severity === "error");
  const warnings = found.filter((diagnostic) => diagnostic.severity === "warning");
  const listed = [...errors, ...warnings].slice(0, DIAGNOSTICS_LIMIT);
  return {
    errors: errors.length,
    warnings: warnings.length,
    diagnostics: listed,
    ...(found.length > listed.length ? { truncated: true as const } : {}),
  };
}
