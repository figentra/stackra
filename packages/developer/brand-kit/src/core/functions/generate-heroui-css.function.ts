/**
 * Stackra file contract:
 * Purpose: `generateHerouiCss`, the `heroui_css` output: the HeroUI v3 web CSS and the HeroUI Native (Uniwind) CSS of
 *          the resolved theme, rendered by `@stackra/tokens`.
 * Boundary: pure; writes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended); ADR 0340.
 */
import { renderNativeCss, renderWebCss } from "@stackra/tokens";

import { BrandOutput } from "#contracts/enums/brand-output.enum";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";

const encode = (css: string) => new TextEncoder().encode(css);

/**
 * The HeroUI CSS files.
 *
 * @example
 * const [web, native] = await generateHerouiCss(input);
 */
export async function generateHerouiCss(input: KitInput): Promise<GeneratedFile[]> {
  return [
    {
      path: "heroui/web.css",
      output: BrandOutput.HerouiCss,
      bytes: encode(renderWebCss(input.theme)),
    },
    {
      path: "heroui/native.css",
      output: BrandOutput.HerouiCss,
      bytes: encode(renderNativeCss(input.theme)),
    },
  ];
}
