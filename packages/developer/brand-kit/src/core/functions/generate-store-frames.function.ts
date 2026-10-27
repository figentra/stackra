/**
 * Stackra file contract:
 * Purpose: `generateStoreFrames`, the `store_frame` output: for every app, locale, device frame and caption, the
 *          framed store screenshot at `store/<app>/<locale>/<frame>/<nn>-<screen>.png`.
 * Boundary: pure apart from the renderer port. Screenshots are captured by the CI job (stackra-13), never here.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19).
 */
import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import type { SvgRenderer } from "#contracts/types/svg-renderer.type";
import { DEVICE_FRAMES } from "#core/constants/device-frames.constant";
import { storeFrameSvg } from "#core/functions/store-frame-svg.function";

/**
 * The store frame files.
 *
 * @example
 * const files = await generateStoreFrames(input, render);
 */
export async function generateStoreFrames(
  input: KitInput,
  render: SvgRenderer,
): Promise<GeneratedFile[]> {
  const out: GeneratedFile[] = [];
  for (const set of input.store)
    for (const frame of DEVICE_FRAMES)
      for (const [index, { screen, text }] of set.captions.entries()) {
        const svg = storeFrameSvg({
          theme: input.theme,
          frame,
          locale: set.locale,
          caption: text,
          screenshot: set.screenshots.get(screen),
        });
        out.push({
          path: `store/${set.app}/${set.locale}/${frame.id}/${String(index + 1).padStart(2, "0")}-${screen}.png`,
          output: BrandOutput.StoreFrame,
          bytes: await render(svg, frame.width),
        });
      }
  return out;
}
