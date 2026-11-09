/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/branding (the resolved `BrandProfile` and its parts)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf every other entry may import; types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { BrandColor } from "#contracts/types/brand-color.type";
export type { BrandImage } from "#contracts/types/brand-image.type";
export type { BrandImageVariants } from "#contracts/types/brand-image-variants.type";
export type { BrandProfile } from "#contracts/types/brand-profile.type";
