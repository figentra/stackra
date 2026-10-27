/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/icons, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { IconRegistryProvider } from "#react/icon-registry-provider/icon-registry-provider";
export type { IconRegistryProviderProps } from "#react/icon-registry-provider/icon-registry-provider.props";
export { useIcon } from "#react/icon-registry-provider/use-icon";
