/**
 * Stackra file contract:
 * Purpose: `generateBrandSet(root, generator, options)`, the Runway step that generates a product's brand set in CI:
 *          builds the request from the root runway (`brandGenerateRequest`) and runs it on the generator.
 * Boundary: the generated set lands in the gitignored `.stackra/brand` and is never committed; a later step (the web
 *           build, the mobile build) reads it from there. The generator's own errors (a broken kit) are rethrown as
 *           they are, so the CI log names the kit problem.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5: Runway runs @stackra/brand-kit as a CI step; outputs are never committed).
 */
import { brandGenerateRequest } from "#core/functions/brand-generate-request.function";
import type { BrandGenerator } from "#core/ports/brand-generator.port";
import type { BrandGenerateRecord } from "#core/types/brand-generate-record.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * Generates the brand set of `root`.
 *
 * @param root - the parsed root runway.
 * @param generator - the brand generator (`BrandKitGeneratorDriver` in CI).
 * @param options.screenshots - the screenshot job's output folder, when it ran.
 * @example
 * const record = await generateBrandSet(root, new BrandKitGeneratorDriver({ cwd: repoRoot }));
 * record.files.includes("favicon/site.webmanifest"); // true
 */
export function generateBrandSet(
  root: RootRunway,
  generator: BrandGenerator,
  options: { readonly screenshots?: string } = {},
): Promise<BrandGenerateRecord> {
  return generator.generate(brandGenerateRequest(root, options));
}
