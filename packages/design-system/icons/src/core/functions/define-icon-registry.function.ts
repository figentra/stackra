/**
 * Stackra file contract:
 * Purpose: builds a registry from the icons an app uses, checked by type: every key is an `IconName` and every value a
 *          component that takes the icon props. It serves both platforms, whose Lucide components share one shape.
 * Boundary: pure; a frozen copy, nothing is imported from an icon library, so an unused icon is never bundled.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets).
 */
import type { IconRegistry } from "#contracts/types/icon-registry.type";

/**
 * A frozen registry of the given icons. Custom icons join under their namespace in the same call.
 * @param icons - components by name, for example `{ "arrow-right": ArrowRight, "loyalty::points-badge": PointsBadge }`
 * @returns the registry, to give to a platform's `IconRegistryProvider`
 */
export function defineIconRegistry(icons: IconRegistry): IconRegistry {
  return Object.freeze({ ...icons });
}
