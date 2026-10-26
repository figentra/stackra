/**
 * Stackra file contract:
 * Purpose: `brandGenerateRequest(root, options)`, the brand step's request for a product repository: the kit at
 *          `<assets root>/brand`, the captions at `<assets root>/store`, the output at `.stackra/brand`, and the
 *          captured screens when the screenshot job ran.
 * Boundary: pure; the assets root is the root runway's `assets.root`, or `assets`. Running it is `generateBrandSet`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 1, 3, 5 and 7).
 */
import { BRAND_OUTPUT_ROOT } from "#core/constants/brand-output-root.constant";
import { DEFAULT_ASSETS_ROOT } from "#core/constants/default-assets-root.constant";
import type { BrandGenerateRequest } from "#core/types/brand-generate-request.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The brand request of `root`.
 *
 * @param root - the parsed root runway.
 * @param options.screenshots - the screenshot job's output folder, when it ran.
 * @example
 * brandGenerateRequest(root, {}); // { kit: "assets/brand", store: "assets/store", out: ".stackra/brand" }
 */
export function brandGenerateRequest(
  root: RootRunway,
  options: { readonly screenshots?: string } = {},
): BrandGenerateRequest {
  const assets = (root.assets?.root ?? DEFAULT_ASSETS_ROOT).replace(/\/+$/u, "");
  return {
    kit: `${assets}/brand`,
    store: `${assets}/store`,
    out: BRAND_OUTPUT_ROOT,
    ...(options.screenshots === undefined ? {} : { screenshots: options.screenshots }),
  };
}
