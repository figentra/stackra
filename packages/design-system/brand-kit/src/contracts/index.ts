/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/brand-kit until `stackra gen` writes the entry barrels
 *          (STA-339): the kit configuration type, the version status enum, the planned output, the outlined text, the
 *          located kit and the run record.
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { KitStatus } from "#contracts/enums/kit-status.enum";
export type { BrandKit } from "#contracts/types/brand-kit.type";
export type { BrandOutput } from "#contracts/types/brand-output.type";
export type { GenerateResult } from "#contracts/types/generate-result.type";
export type { LocatedKit } from "#contracts/types/located-kit.type";
export type { TextOutline } from "#contracts/types/text-outline.type";
