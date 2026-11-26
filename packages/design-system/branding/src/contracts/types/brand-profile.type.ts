/**
 * Stackra file contract:
 * Purpose: `BrandProfile`, a tenant's brand as every surface reads it: the display name for one locale, the logo and
 *          the mark, and the primary and accent colours with their on-colours, each already resolved tenant, then
 *          platform, then plain (`null`).
 * Boundary: a type in the leaf entry, returned by `BrandReader#profile`. `null` means nothing is set at any level; a
 *           surface then draws its plain default (black on white, no logo).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md; rule R8); STA-2644.
 */
import type { BrandColor } from "#contracts/types/brand-color.type";
import type { BrandImage } from "#contracts/types/brand-image.type";

/**
 * The resolved brand of one tenant in one locale.
 *
 * @example
 * const brand = await this.brand.profile(Locale.Ar);
 * header.title = brand.displayName ?? legalName;
 */
export interface BrandProfile {
  /** The name in the asked locale, else in the other base locale, else `null`. */
  readonly displayName: string | null;

  /** The logo, or `null`. */
  readonly logo: BrandImage | null;

  /** The square mark; the logo when no mark is set. */
  readonly mark: BrandImage | null;

  /** The primary colour and its on-colour, or `null`. */
  readonly primary: BrandColor | null;

  /** The accent colour and its on-colour, or `null`. */
  readonly accent: BrandColor | null;
}
