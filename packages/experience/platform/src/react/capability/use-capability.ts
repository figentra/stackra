/**
 * Stackra file contract:
 * Purpose: `useCapability(name, options)`, the hook that hands out one facet of the platform (`"scanner"`,
 *          `"network"`, ...) only when the target offers it: `null` otherwise, so the caller renders its degraded
 *          state. With `{ required: true }` the facet is always returned, because the route or file declared the
 *          capability as required and gen refused a target without it.
 * Boundary: a target that does not offer a required capability is a wiring bug, not a runtime state, so it throws. A
 *           device that lacks the hardware today (a simulator's camera) still gets the facet and reads its own state
 *           (`scanner.isAvailable`).
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 to 4); ADR 0294 (decision 17).
 */
import type { Platform } from "#contracts/ports/platform.port";
import { CAPABILITY_FACETS } from "#core/constants/capability-facets.constant";
import { usePlatform } from "#react/platform/use-platform";

/** A facet name of the platform. */
type Facet = keyof typeof CAPABILITY_FACETS;

/**
 * The `name` facet, which the route or file declared required.
 *
 * @throws Error when the target does not offer the capability (gen should have refused the target).
 * @example
 * const scanner = useCapability("scanner", { required: true });
 * if (!scanner.isAvailable) return { kind: "unavailable" };
 */
export function useCapability<K extends Facet>(
  name: K,
  options: { readonly required: true },
): Platform[K];

/**
 * The `name` facet, or `null` when the target does not offer it.
 *
 * @example
 * const share = useCapability("share");
 * return share === null ? null : <Button onPress={() => share.share({ url })} />;
 */
export function useCapability<K extends Facet>(
  name: K,
  options?: { readonly required?: boolean },
): Platform[K] | null;

/** The implementation behind the overloads above. */
export function useCapability(
  name: Facet,
  options: { readonly required?: boolean } = {},
): Platform[Facet] | null {
  const platform = usePlatform();
  const capability = CAPABILITY_FACETS[name];
  if (platform.has(capability)) return platform[name];
  if (options.required === true)
    throw new Error(`The target does not offer the required capability "${capability}"`);
  return null;
}
