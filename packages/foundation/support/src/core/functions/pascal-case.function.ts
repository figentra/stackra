/**
 * Stackra file contract:
 * Purpose: `pascalCase`, any naming form to PascalCase: the class name of a key (`LoyaltyKitModule` from
 *          `loyalty_kit`), a kind's base class from its kebab-case name.
 * Boundary: public and pure; built on `camelCase`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file, rule 16); ADR 0231 (class names); stackra-224 (one copy,
 *                     was gen; coding-standard keeps its own, see tools/scripts/duplicate-exports.mjs).
 */
import { camelCase } from "#core/functions/camel-case.function";

/**
 * The PascalCase form of `name`.
 *
 * @example
 * pascalCase("loyalty_kit"); // "LoyaltyKit"
 * pascalCase("state-machine"); // "StateMachine"
 */
export function pascalCase(name: string): string {
  const camel = camelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
