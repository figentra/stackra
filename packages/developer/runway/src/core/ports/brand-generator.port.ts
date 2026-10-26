/**
 * Stackra file contract:
 * Purpose: the `BrandGenerator` port: generates a product's brand set (tokens, HeroUI CSS, app and adaptive icons,
 *          splash screens, favicons and the web manifest, store-screenshot frames) from its kit, and answers the files
 *          it wrote.
 * Boundary: an abstract class that is its own token. Runway depends on no brand code: the driver runs the
 *           `@stackra/brand-kit` command line, and no Figentra package is ever a dependency (ADR 0441 enforcement).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5), ADR 0263 (ports resolve by type), ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { BrandGenerateRecord } from "#core/types/brand-generate-record.type";
import type { BrandGenerateRequest } from "#core/types/brand-generate-request.type";

/** Where brand sets are generated. */
export abstract class BrandGenerator extends Port {
  /**
   * Generates the set `request` describes.
   *
   * @param request - from `brandGenerateRequest`.
   * @returns the run's record.
   */
  abstract generate(request: BrandGenerateRequest): Promise<BrandGenerateRecord>;
}
