/**
 * Stackra file contract:
 * Purpose: `generateFavicons`, the `favicon` output: `favicon.ico` (the favicon source at each `BRAND_SIZES.favicon.ico`
 *          size), the SVG favicon itself, and the Apple touch icon from the light app icon.
 * Boundary: pure apart from the renderer port.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: favicons).
 */
import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";
import { BRAND_SIZES } from "#core/constants/brand-sizes.constant";
import { KIT_SOURCES } from "#core/constants/kit-sources.constant";
import { encodeIco } from "#core/functions/encode-ico.function";
import { sourceSvg } from "#core/functions/source-svg.function";

/**
 * The favicon files.
 *
 * @example
 * const files = await generateFavicons(input, render);
 */
export async function generateFavicons(
  input: KitInput,
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const favicon = sourceSvg(input, KIT_SOURCES.favicon);
  const images = [];
  for (const size of BRAND_SIZES.favicon.ico)
    images.push({ size, png: await render(favicon, size) });
  const { path, size } = BRAND_SIZES.favicon.appleTouch;
  return [
    { path: "favicon/favicon.ico", output: BrandOutput.Favicon, bytes: encodeIco(images) },
    {
      path: "favicon/favicon.svg",
      output: BrandOutput.Favicon,
      bytes: new TextEncoder().encode(favicon),
    },
    {
      path,
      output: BrandOutput.Favicon,
      bytes: await render(sourceSvg(input, KIT_SOURCES.appIconLight), size),
    },
  ];
}
