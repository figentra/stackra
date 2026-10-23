/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/ui, which has several public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ColorScheme, type ResolvedColorScheme } from "#contracts/enums/color-scheme.enum";
export { Direction } from "#contracts/enums/direction.enum";
export { Size } from "#contracts/enums/size.enum";
export { Tone } from "#contracts/enums/tone.enum";
export { Variant } from "#contracts/enums/variant.enum";
export type { DesignSystemProviderProps } from "#contracts/types/design-system-provider-props.type";
export type { DesignSystemState } from "#contracts/types/design-system-state.type";
