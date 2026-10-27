/**
 * Stackra file contract:
 * Purpose: `OUTPUT_SOURCES`, the kit sources each output kind needs, so the kit file checklist only asks for what the
 *          selected outputs read.
 * Boundary: data only. `theme` is the kit theme; every other key names a `KIT_SOURCES` file.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { KitSource } from "#core/types/kit-source.type";

/** Required sources per output kind. */
export const OUTPUT_SOURCES: Readonly<Record<BrandOutput, readonly KitSource[]>> = Object.freeze({
  [BrandOutput.Tokens]: ["theme"],
  [BrandOutput.HerouiCss]: ["theme"],
  [BrandOutput.AppIcon]: ["appIconLight"],
  [BrandOutput.AdaptiveIcon]: ["theme", "adaptiveForeground"],
  [BrandOutput.Splash]: ["theme", "splashLight"],
  [BrandOutput.Favicon]: ["favicon", "appIconLight"],
  [BrandOutput.WebManifest]: ["theme", "appIconLight"],
  [BrandOutput.StoreFrame]: ["theme"],
});
