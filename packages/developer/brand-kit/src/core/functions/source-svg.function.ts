/**
 * Stackra file contract:
 * Purpose: `sourceSvg`, the text of a kit source SVG, falling back through the paths given (a dark variant falls
 *          back to its light one).
 * Boundary: pure; throws when none of the paths is in the kit, which `generateBrand`'s readiness check prevents.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import type { KitInput } from "#contracts/types/kit-input.type";
import { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";

/**
 * The first of `paths` the kit has, as text.
 *
 * @example
 * const svg = sourceSvg(input, KIT_SOURCES.splashDark, KIT_SOURCES.splashLight);
 * @throws InvalidBrandKitError when the kit has none of them.
 */
export function sourceSvg(input: KitInput, ...paths: readonly string[]): string {
  for (const path of paths) {
    const bytes = input.sources.get(path);
    if (bytes) return new TextDecoder().decode(bytes);
  }
  throw new InvalidBrandKitError([`missing ${paths.join(" or ")}`]);
}
