/**
 * Stackra file contract:
 * Purpose: `formatGenError`, the two lines a gen refusal prints: the location, code, subject and message, then the
 *          fix, which is what an author or an agent reads to correct it.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: refusals print their fix).
 */
import type { GenError } from "#core/types/gen-error.type";

/**
 * The printed form of `error`.
 *
 * @example
 * formatGenError(error);
 * // src/node/schemas/x.schema.ts:4:3 error shape_number_kind X.count: a number field needs @Int or @Num
 * //   fix: add @Int() for whole numbers or @Num() for decimals above the field
 */
export function formatGenError(error: GenError): string {
  const at = error.line > 0 ? `${error.file}:${error.line}:${error.column}` : error.file;
  return `${at} error ${error.code} ${error.subject}: ${error.message}\n  fix: ${error.fix}`;
}
