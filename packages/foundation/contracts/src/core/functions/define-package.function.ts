/**
 * Stackra file contract:
 * Purpose: `definePackage`, the one call in a package member's `stackra.config.ts`.
 * Boundary: a typed identity function with no runtime effect: gen reads the argument from the syntax tree without
 *           running it. A package passes `{}`.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 1), ADR 0305 (rule 3), ADR 0127 2026-10-24 note (define* live in contracts).
 */
import type { PackageDefinition } from "#core/types/package-definition.type";

/**
 * Declares a package member.
 *
 * @example
 * export default definePackage({});
 */
export function definePackage(definition: PackageDefinition): PackageDefinition {
  return definition;
}
