/**
 * Stackra file contract:
 * Purpose: `generateAdaptiveIcon`, the `adaptive_icon` output: the Android adaptive foreground and monochrome layers
 *          (the monochrome falls back to the foreground) and `adaptive-icon.json` with the background colour Expo's
 *          `android.adaptiveIcon.backgroundColor` takes (the theme's `background`, light).
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
 * The adaptive icon files.
 *
 * @example
 * const files = await generateAdaptiveIcon(input, render);
 */
export async function generateAdaptiveIcon(
  input: KitInput,
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const { foreground, monochrome, size } = BRAND_SIZES.adaptive;
  const front = sourceSvg(input, KIT_SOURCES.adaptiveForeground);
  const mono = sourceSvg(input, KIT_SOURCES.adaptiveMonochrome, KIT_SOURCES.adaptiveForeground);
  const settings = { backgroundColor: input.theme.colors.background.hexLight };
  return [
    { path: foreground, output: BrandOutput.AdaptiveIcon, bytes: await render(front, size) },
    { path: monochrome, output: BrandOutput.AdaptiveIcon, bytes: await render(mono, size) },
    {
      path: "icons/android/adaptive/adaptive-icon.json",
      output: BrandOutput.AdaptiveIcon,
      bytes: new TextEncoder().encode(`${JSON.stringify(settings, null, 2)}\n`),
    },
  ];
}
