/**
 * Stackra file contract:
 * Purpose: looks an `IconName` up in a registry: the name itself first, then, for a Stackra alias, the Lucide name it
 *          stands for, so a registry that holds only `shopping-cart` still draws `orders`.
 * Boundary: pure; reads own properties only, because a data-driven name such as `constructor` must not reach
 *          `Object.prototype`. A name with no entry is `undefined`; what to draw then is the caller's decision.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0294 (decision 15).
 */
import type { IconAlias } from "#contracts/enums/icon-alias.enum";
import type { IconComponent } from "#contracts/types/icon-component.type";
import type { IconName } from "#contracts/types/icon-name.type";
import type { IconRegistry } from "#contracts/types/icon-registry.type";
import { ICON_ALIAS_TARGETS } from "#core/constants/icon-alias-targets.constant";

/**
 * The component a registry holds for a name, or for the Lucide name an alias resolves to.
 * @param registry - the icons a platform can draw
 * @param name - the icon to draw, in any of its three forms
 * @returns the component, or undefined when the registry has neither the name nor its alias target
 */
export function findIcon(registry: IconRegistry, name: IconName): IconComponent | undefined {
  if (Object.hasOwn(registry, name)) return registry[name];
  if (!Object.hasOwn(ICON_ALIAS_TARGETS, name)) return undefined;
  const target = ICON_ALIAS_TARGETS[name as IconAlias];
  return Object.hasOwn(registry, target) ? registry[target] : undefined;
}
