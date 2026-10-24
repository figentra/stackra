/**
 * Stackra file contract:
 * Purpose: `configKeyOf`, the key of a configuration class read from its root class name at build time: the member
 *          key for the class named after the member, `<member>.<snake(stem)>` otherwise. An override inherits its
 *          base's key, so gen passes the base's name and the declaring member.
 * Boundary: pure, over a name: gen has no class to hand to `configKey` of @stackra/config, which derives the same key
 *           from a class at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: config key); ADR 0305 (rule 34).
 */
import { snakeCase } from "#core/functions/snake-case.function";

/**
 * The key of a configuration class.
 *
 * @param className - the root configuration class name (`LoyaltyKitConfig`).
 * @param member - the member key that declares it.
 * @example
 * configKeyOf("LoyaltyKitConfig", "loyalty_kit"); // "loyalty_kit"
 * configKeyOf("RateLimitConfig", "commerce"); // "commerce.rate_limit"
 */
export function configKeyOf(className: string, member: string): string {
  const stem = snakeCase(className.replace(/Config$/, ""));
  return stem === member ? member : `${member}.${stem}`;
}
