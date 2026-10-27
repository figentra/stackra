/**
 * Stackra file contract:
 * Purpose: `missingSources`, the kit sources an output kind needs (`OUTPUT_SOURCES`) that the kit lacks.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import type { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { KitInput } from "#contracts/types/kit-input.type";
import { KIT_SOURCES } from "#core/constants/kit-sources.constant";
import { OUTPUT_SOURCES } from "#core/constants/output-sources.constant";

/**
 * The missing source paths of `output`.
 *
 * @example
 * missingSources(input, BrandOutput.Splash); // ["logos/splash/splash-light.svg"]
 */
export function missingSources(input: KitInput, output: BrandOutput): string[] {
  return OUTPUT_SOURCES[output]
    .map((key) => KIT_SOURCES[key])
    .filter((path) => !input.sources.has(path));
}
