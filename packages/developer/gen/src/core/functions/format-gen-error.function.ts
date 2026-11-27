/**
 * Stackra file contract:
 * Purpose: `formatGenError`, the three lines a gen finding prints: the location, the word `error` or `warning`, the
 *          code, subject and message; then the fix, which is what an author or an agent reads to correct it; then the
 *          docs line, the code's place in the error-code reference and the `stackra explain` command that prints it.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: refusals print their fix); ADR 0101 (Enforcement: gen warns); STA-2891
 *                     (a docs link on every finding).
 */
import { errorCodeDocs } from "#core/functions/error-code-docs.function";
import type { GenError } from "#core/types/gen-error.type";

/**
 * The printed form of `error`.
 *
 * @example
 * formatGenError(error);
 * // src/node/schemas/x.schema.ts:4:3 error shape_number_kind X.count: a number field needs @Int or @Num
 * //   fix: add @Int for whole numbers or @Num for decimals above the field
 * //   docs: https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields (stackra explain shape_number_kind)
 */
export function formatGenError(error: GenError): string {
  const at = error.line > 0 ? `${error.file}:${error.line}:${error.column}` : error.file;
  return [
    `${at} ${error.severity ?? "error"} ${error.code} ${error.subject}: ${error.message}`,
    `  fix: ${error.fix}`,
    `  docs: ${errorCodeDocs(error.code)} (stackra explain ${error.code})`,
  ].join("\n");
}
