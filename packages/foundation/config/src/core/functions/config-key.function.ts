/**
 * Stackra file contract:
 * Purpose: `configKey`, the derivation of a configuration's key (ADR 0294 decision 20): the member key for the file
 *          named after the member, otherwise `<member>.<snake(stem)>`; an override inherits its base's key. Gen locks
 *          the key in the manifest and writes it to the wiring; runtime code and gen share this one function.
 * Boundary: reads the class name, which is `PascalCase(stem) + "Config"` (ADR 0294 R2), and the member key the caller
 *           passes; it cannot see the file, so the member is an argument.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20; rule R2); ADR 0305 (rule 1).
 */
import type { AnyClass } from "@stackra/container";

import { configRoot } from "#core/functions/config-root.function";

/**
 * The key of `type` in `member`.
 *
 * @param type - a configuration class or a host override of one.
 * @param member - the member key that declares the base class (`loyalty_kit`, `commerce`).
 * @throws TypeError when `type` is not a configuration.
 * @example
 * configKey(LoyaltyKitConfig, "loyalty_kit"); // "loyalty_kit"
 * configKey(DeliveryConfig, "notifications"); // "notifications.delivery"
 */
export function configKey(type: AnyClass, member: string): string {
  const stem = configRoot(type)
    .name.replace(/Config$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  return stem === member ? member : `${member}.${stem}`;
}
