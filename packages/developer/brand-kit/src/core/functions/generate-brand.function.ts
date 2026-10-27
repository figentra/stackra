/**
 * Stackra file contract:
 * Purpose: `generateBrand`, every file of the selected outputs, sorted by path; it refuses an output whose required
 *          kit sources (`OUTPUT_SOURCES`) are missing.
 * Boundary: pure apart from the renderer port; the dispatch table maps each `BrandOutput` to its generator.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: deterministic output).
 */
import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";
import { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";
import { generateAdaptiveIcon } from "#core/functions/generate-adaptive-icon.function";
import { generateAppIcons } from "#core/functions/generate-app-icons.function";
import { generateFavicons } from "#core/functions/generate-favicons.function";
import { generateHerouiCss } from "#core/functions/generate-heroui-css.function";
import { generateSplash } from "#core/functions/generate-splash.function";
import { generateStoreFrames } from "#core/functions/generate-store-frames.function";
import { generateTokens } from "#core/functions/generate-tokens.function";
import { generateWebManifest } from "#core/functions/generate-web-manifest.function";
import { missingSources } from "#core/functions/missing-sources.function";
import type { BrandGenerator } from "#core/types/brand-generator.type";

const GENERATORS: Readonly<Record<BrandOutput, BrandGenerator>> = {
  [BrandOutput.Tokens]: generateTokens,
  [BrandOutput.HerouiCss]: generateHerouiCss,
  [BrandOutput.AppIcon]: generateAppIcons,
  [BrandOutput.AdaptiveIcon]: generateAdaptiveIcon,
  [BrandOutput.Splash]: generateSplash,
  [BrandOutput.Favicon]: generateFavicons,
  [BrandOutput.WebManifest]: generateWebManifest,
  [BrandOutput.StoreFrame]: generateStoreFrames,
};

/**
 * Every file of `outputs`, sorted by path.
 *
 * @example
 * const files = await generateBrand(input, Enum.values(BrandOutput), render);
 * @throws InvalidBrandKitError when an output's required source is missing (`--check` reports these instead).
 */
export async function generateBrand(
  input: KitInput,
  outputs: readonly BrandOutput[],
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const missing = [...new Set(outputs.flatMap((output) => missingSources(input, output)))];
  if (missing.length > 0) throw new InvalidBrandKitError(missing.map((path) => `missing ${path}`));
  const files: GeneratedFile[] = [];
  for (const output of new Set(outputs)) files.push(...(await GENERATORS[output](input, render)));
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
