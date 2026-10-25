/**
 * Stackra file contract:
 * Purpose: `kebabCase`, the name-to-URL-segment conversion of the endpoint convention and of file stems.
 * Boundary: pure; built on `snakeCase`, so the two never disagree on word breaks.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (URL paths are kebab-case); ADR 0294 (decision 21).
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
