/**
 * Stackra file contract:
 * Purpose: `settingsKeyOf`, the derivation of a settings group's key (ADR 0294 decision 20): the module key, which the
 *          class name carries as `PascalCase(module) + "Settings"` (`LoyaltyKitSettings` is `loyalty_kit`); a host
 *          override keeps its base's name and key.
 * Boundary: reads the class name of the class directly below the `Settings(...)` call, as `configKey` reads a
 *           configuration's; gen derives the same key from the folder and locks it in the manifest. A server build
 *           keeps class names; a minifying client build reads settings through pages, never through this. Internal:
 *           not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20; rule R2: class names); ADR 0305 (rule 1: overrides keep the name); ADR
 *                     0307 (rule 22).
 */
import { kindOf } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

/**
 * The group key of `type`.
 *
 * @throws TypeError when `type` does not extend `Settings({ scopes })`, or its name carries no module.
 * @example
 * settingsKeyOf(OrdersSettings); // "orders"
 * settingsKeyOf(LoyaltyKitSettings); // "loyalty_kit"
 */
export function settingsKeyOf(type: AnyClass): string {
  const record = kindOf(type);
  if (record?.kind !== "settings" || record.options["scopes"] === undefined)
    throw new TypeError(
      `${type.name || "This class"} is not a settings class: declare it with extends Settings({ scopes })`,
    );
  let root: object = type;
  for (
    let parent = Object.getPrototypeOf(root) as object | null;
    parent !== null && kindOf(Object.getPrototypeOf(parent) as object) === record;
    parent = Object.getPrototypeOf(parent) as object | null
  )
    root = parent;
  const key = (root as AnyClass).name
    .replace(/Settings$/, "")
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  if (key === "")
    throw new TypeError(
      `${(root as AnyClass).name || "A settings class"} is named <Module>Settings`,
    );
  return key;
}
