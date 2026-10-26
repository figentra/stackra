/**
 * Stackra file contract:
 * Purpose: `planBrand(kit, theme, symbolSvg)`, every generated file of a kit except the store frames, as planned
 *          outputs: the theme as JSON and as DTCG tokens, the HeroUI web and native CSS, the app icons, the Android
 *          adaptive icon layers (foreground, background, monochrome), the light and dark splash images with their
 *          colours, and the favicon set (SVG, ICO, apple-touch icon, the 192 and 512 icons, the maskable icon) with
 *          the web manifest.
 * Boundary: pure: the same kit, theme and symbol always plan the same bytes. Every colour comes from a theme role the
 *           kit names; the token and CSS renderers are @stackra/tokens', so this package holds no colour logic. The
 *           safe zones are the platforms' (Android adaptive icons show 72 of 108 dp; a maskable icon keeps its
 *           content in the central 80 %).
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5), ADR 0340 decision 10 as amended by 0441.
 */
import { exportThemeJson, renderNativeCss, renderWebCss, themeToDtcg } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

import type { BrandKit } from "#contracts/types/brand-kit.type";
import type { BrandOutput } from "#contracts/types/brand-output.type";
import { iconSvg } from "#core/functions/icon-svg.function";
import { symbolOf } from "#core/functions/symbol-of.function";
import { webManifest } from "#core/functions/web-manifest.function";

/** The share of an Android adaptive icon layer that shows through the mask (72 of 108 dp). */
const ADAPTIVE_VISIBLE = 72 / 108;

/** The share of a maskable web icon that is always shown. */
const MASKABLE_SAFE = 0.8;

/** Pretty JSON with a final newline. */
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

/**
 * The planned outputs of `kit`.
 *
 * @param kit - the parsed kit.
 * @param theme - the kit's resolved theme.
 * @param symbolSvg - the text of the kit's symbol file.
 * @throws InvalidKitError when the symbol is unusable.
 * @example
 * for (const output of planBrand(kit, theme, readFileSync(join(dir, kit.symbol), "utf8"))) write(output);
 */
export function planBrand(kit: BrandKit, theme: Theme, symbolSvg: string): BrandOutput[] {
  const symbol = symbolOf(symbolSvg, kit.symbol);
  const light = (role: keyof Theme["colors"]): string => theme.colors[role].hexLight;
  const dark = (role: keyof Theme["colors"]): string => theme.colors[role].hexDark;
  const { icon, splash } = kit;
  const tile = (scale: number, radius = 0): string =>
    iconSvg(symbol, {
      color: light(icon.foreground),
      background: light(icon.background),
      scale,
      radius,
    });

  const outputs: BrandOutput[] = [
    { kind: "text", path: "tokens/theme.json", text: json(exportThemeJson(theme)) },
    { kind: "text", path: "tokens/tokens.dtcg.json", text: json(themeToDtcg(theme)) },
    { kind: "text", path: "heroui/web.css", text: renderWebCss(theme) },
    { kind: "text", path: "heroui/native.css", text: renderNativeCss(theme) },
  ];

  for (const size of icon.sizes)
    outputs.push({
      kind: "png",
      path: `icons/app-icon-${size}.png`,
      svg: tile(icon.scale),
      width: size,
    });

  const adaptive = icon.scale * ADAPTIVE_VISIBLE;
  outputs.push(
    {
      kind: "png",
      path: "android/adaptive-foreground.png",
      svg: iconSvg(symbol, { color: light(icon.foreground), scale: adaptive }),
      width: 1024,
    },
    {
      kind: "png",
      path: "android/adaptive-background.png",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><rect width="1024" height="1024" fill="${light(icon.background)}"/></svg>\n`,
      width: 1024,
    },
    {
      kind: "png",
      path: "android/adaptive-monochrome.png",
      // Android tints the monochrome layer from its alpha alone, so its colour is not brand data.
      svg: iconSvg(symbol, { color: "#FFFFFF", scale: adaptive }),
      width: 1024,
    },
  );

  outputs.push(
    {
      kind: "png",
      path: "splash/splash-icon.light.png",
      svg: iconSvg(symbol, { color: light(splash.foreground), scale: splash.scale }),
      width: splash.size,
    },
    {
      kind: "png",
      path: "splash/splash-icon.dark.png",
      svg: iconSvg(symbol, { color: dark(splash.foreground), scale: splash.scale }),
      width: splash.size,
    },
    {
      kind: "text",
      path: "splash/splash.json",
      text: json({
        light: { image: "splash-icon.light.png", backgroundColor: light(splash.background) },
        dark: { image: "splash-icon.dark.png", backgroundColor: dark(splash.background) },
      }),
    },
  );

  const rounded = tile(icon.scale, icon.radius);
  outputs.push(
    { kind: "text", path: "favicon/favicon.svg", text: rounded },
    { kind: "ico", path: "favicon/favicon.ico", svg: rounded, sizes: [16, 32, 48] },
    { kind: "png", path: "favicon/apple-touch-icon.png", svg: tile(icon.scale), width: 180 },
    { kind: "png", path: "favicon/icon-192.png", svg: rounded, width: 192 },
    { kind: "png", path: "favicon/icon-512.png", svg: rounded, width: 512 },
    {
      kind: "png",
      path: "favicon/icon-maskable-512.png",
      svg: tile(icon.scale * MASKABLE_SAFE),
      width: 512,
    },
    { kind: "text", path: "favicon/site.webmanifest", text: json(webManifest(kit, theme)) },
  );
  return outputs;
}
