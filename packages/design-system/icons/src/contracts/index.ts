/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/icons, which has several public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { IconAlias } from "#contracts/enums/icon-alias.enum";
export { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";
export type { CustomIconName } from "#contracts/types/custom-icon-name.type";
export type { IconComponent, IconComponentProps } from "#contracts/types/icon-component.type";
export type { IconName } from "#contracts/types/icon-name.type";
export type { IconRegistry } from "#contracts/types/icon-registry.type";
