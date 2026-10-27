/**
 * Stackra file contract:
 * Purpose: `generateSplash`, the `splash` output: the light and dark splash images (dark falls back to light) and
 *          `splash.json` with the background colours Expo's splash config takes (the theme's `background`).
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
 * The splash files.
 *
 * @example
 * const files = await generateSplash(input, render);
 */
export async function generateSplash(
  input: KitInput,
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const { light, dark, size } = BRAND_SIZES.splash;
  const background = input.theme.colors.background;
  const settings = {
    backgroundColor: background.hexLight,
    dark: { backgroundColor: background.hexDark },
  };
  return [
    {
      path: light,
      output: BrandOutput.Splash,
      bytes: await render(sourceSvg(input, KIT_SOURCES.splashLight), size),
    },
    {
      path: dark,
      output: BrandOutput.Splash,
      bytes: await render(sourceSvg(input, KIT_SOURCES.splashDark, KIT_SOURCES.splashLight), size),
    },
    {
      path: "splash/splash.json",
      output: BrandOutput.Splash,
      bytes: new TextEncoder().encode(`${JSON.stringify(settings, null, 2)}\n`),
    },
  ];
}
