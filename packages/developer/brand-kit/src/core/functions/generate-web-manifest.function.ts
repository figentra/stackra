/**
 * Stackra file contract:
 * Purpose: `generateWebManifest`, the `web_manifest` output: `web/manifest.webmanifest` (name and short name from
 *          `kit.json`, theme and background colours from the theme) and the icons it lists.
 * Boundary: pure apart from the renderer port. The manifest's `lang` is English; per-locale manifests are not made.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: web manifest).
 */
import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";
import { BRAND_SIZES } from "#core/constants/brand-sizes.constant";
import { KIT_SOURCES } from "#core/constants/kit-sources.constant";
import { sourceSvg } from "#core/functions/source-svg.function";

/**
 * The web manifest and its icons.
 *
 * @example
 * const files = await generateWebManifest(input, render);
 */
export async function generateWebManifest(
  input: KitInput,
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const icon = sourceSvg(input, KIT_SOURCES.appIconLight);
  const out: GeneratedFile[] = [];
  for (const { path, size } of BRAND_SIZES.web)
    out.push({ path, output: BrandOutput.WebManifest, bytes: await render(icon, size) });
  const manifest = {
    name: input.kit.name.en,
    short_name: input.kit.name.en,
    description: input.kit.line.en,
    lang: "en",
    start_url: "/",
    display: "standalone",
    theme_color: input.theme.colors.accent.hexLight,
    background_color: input.theme.colors.background.hexLight,
    icons: BRAND_SIZES.web.map(({ path, size }) => ({
      src: path.slice(path.lastIndexOf("/") + 1),
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
  };
  out.push({
    path: "web/manifest.webmanifest",
    output: BrandOutput.WebManifest,
    bytes: new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`),
  });
  return out;
}
