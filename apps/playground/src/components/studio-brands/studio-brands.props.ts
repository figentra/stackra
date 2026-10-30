/**
 * Stackra file contract:
 * Purpose: `StudioBrandsProps`: props of `StudioBrands`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { BrandTheme } from "#src/constants/brand-themes";

/** Props of {@link StudioBrands}. */
export interface StudioBrandsProps {
  /** The brand the showcase is drawn in. */
  value: BrandTheme;
  /** Called with the brand the reader picks. */
  onChange: (brand: BrandTheme) => void;
}
