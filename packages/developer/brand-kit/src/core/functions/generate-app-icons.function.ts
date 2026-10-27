/**
 * Stackra file contract:
 * Purpose: `generateAppIcons`, the `app_icon` output: every app icon raster of `BRAND_SIZES.appIcon` from the light
 *          source, and the iOS dark-appearance icon when the kit has a dark source.
 * Boundary: pure apart from the renderer port.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: D17, D18).
 */
import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";
import { BRAND_SIZES } from "#core/constants/brand-sizes.constant";
import { KIT_SOURCES } from "#core/constants/kit-sources.constant";
import { sourceSvg } from "#core/functions/source-svg.function";

/**
 * The app icon files.
 *
 * @example
 * const files = await generateAppIcons(input, render);
 */
export async function generateAppIcons(
  input: KitInput,
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const light = sourceSvg(input, KIT_SOURCES.appIconLight);
  const out: GeneratedFile[] = [];
  for (const { path, size } of BRAND_SIZES.appIcon)
    out.push({ path, output: BrandOutput.AppIcon, bytes: await render(light, size) });
  if (input.sources.has(KIT_SOURCES.appIconDark)) {
    const dark = sourceSvg(input, KIT_SOURCES.appIconDark);
    for (const { path, size } of BRAND_SIZES.appIconDark)
      out.push({ path, output: BrandOutput.AppIcon, bytes: await render(dark, size) });
  }
  return out;
}
