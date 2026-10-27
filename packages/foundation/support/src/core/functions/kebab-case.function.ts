/**
 * Stackra file contract:
 * Purpose: `kebabCase`, any naming form to kebab-case: URL segments of the endpoint convention and file stems.
 * Boundary: public and pure; built on `snakeCase`, so the two never disagree on word breaks.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0231 (URL paths and files are kebab-case);
 *                     stackra-224 (one copy, was gen; coding-standard keeps its own, see
 *                     tools/scripts/duplicate-exports.mjs).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The kebab-case form of `name`.
 *
 * @example
 * kebabCase("attach_image"); // "attach-image"
 * kebabCase("LoyaltyLedger"); // "loyalty-ledger"
 */
export function kebabCase(name: string): string {
  return snakeCase(name).replaceAll("_", "-");
}
