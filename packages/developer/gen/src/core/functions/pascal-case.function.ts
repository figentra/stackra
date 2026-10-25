/**
 * Stackra file contract:
 * Purpose: `pascalCase`, the key-to-class-name conversion that names a generated module class (`LoyaltyKitModule`
 *          from `loyalty_kit`).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (class names); ADR 0305 (rule 16: the generated `<Key>Module`).
 */
import { camelCase } from "#core/functions/camel-case.function";

/**
 * The PascalCase form of `name`.
 *
 * @example
 * pascalCase("loyalty_kit"); // "LoyaltyKit"
 */
export function pascalCase(name: string): string {
  const camel = camelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
