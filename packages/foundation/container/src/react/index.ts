/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/container, which has several public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ContainerProvider } from "#react/container-provider/container-provider";
export type { ContainerProviderProps } from "#react/container-provider/container-provider-props.type";
export { useContainer } from "#react/container-provider/use-container";
