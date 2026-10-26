/**
 * Stackra file contract:
 * Purpose: `planStoreFrames(located, theme, folders)`, the store-screenshot frames: for every captured screen at
 *          `<screenshots>/<app>/<locale>/<name>.png`, one PNG per frame size of the kit at
 *          `store/<app>/<locale>/<frame>/<name>.png`, with the caption from `<store>/<app>/<locale>/captions.json`
 *          (`{ "<name>": "<caption>" }`) outlined in the kit's font for that locale.
 * Boundary: reads the screens, the captions and the fonts; plans, never writes. A screen without a caption is framed
 *           without one. The font for a locale is the kit's `store.fonts[<locale>]`, then its language, then
 *           `default`; a caption with no font is an InvalidKitError, never a system font.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 7: the brand kit adds frames and captions from `assets/store`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Theme } from "@stackra/tokens/contracts";

import type { BrandOutput } from "#contracts/types/brand-output.type";
import type { LocatedKit } from "#contracts/types/located-kit.type";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { pngSize } from "#core/functions/png-size.function";
import { storeFrameSvg } from "#core/functions/store-frame-svg.function";
import { outlineText } from "#node/functions/outline-text.function";

/** The sub-folders of `dir`, sorted. */
const folders = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

/** The captions of one app and locale, or none. */
function captionsOf(file: string): Readonly<Record<string, string>> {
  if (!existsSync(file)) return {};
  const data: unknown = JSON.parse(readFileSync(file, "utf8"));
  if (
    typeof data !== "object" ||
    data === null ||
    Object.values(data).some((value) => typeof value !== "string")
  )
    throw new InvalidKitError(file, ["captions.json maps each screen name to its caption text"]);
  return data as Record<string, string>;
}

/**
 * The planned frames.
 *
 * @param located - the kit and its folder.
 * @param theme - the kit's resolved theme.
 * @param paths.screenshots - the captured screens, `<app>/<locale>/<name>.png`.
 * @param paths.store - the store tree with the captions (`assets/store`).
 * @throws InvalidKitError for a caption file that is not a name-to-text map, or a caption without a font.
 * @example
 * const frames = planStoreFrames(located, theme, { screenshots: ".stackra/screens", store: "assets/store" });
 */
export function planStoreFrames(
  located: LocatedKit,
  theme: Theme,
  paths: { readonly screenshots: string; readonly store: string },
): BrandOutput[] {
  const { store } = located.kit;
  const background = theme.colors[store.background].hexLight;
  const foreground = theme.colors[store.foreground].hexLight;
  const outputs: BrandOutput[] = [];
  for (const app of folders(paths.screenshots))
    for (const locale of folders(join(paths.screenshots, app))) {
      const captions = captionsOf(join(paths.store, app, locale, "captions.json"));
      const fontPath =
        store.fonts[locale] ?? store.fonts[locale.split("-")[0] ?? ""] ?? store.fonts["default"];
      const screens = readdirSync(join(paths.screenshots, app, locale))
        .filter((file) => file.endsWith(".png"))
        .sort();
      for (const file of screens) {
        const name = file.slice(0, -".png".length);
        const png = readFileSync(join(paths.screenshots, app, locale, file));
        const size = pngSize(png);
        const text = captions[name];
        if (text !== undefined && fontPath === undefined)
          throw new InvalidKitError(located.dir, [
            `no store.fonts entry for ${locale} (or "default") to set the caption of ${app}/${locale}/${name}`,
          ]);
        for (const frame of store.frames) {
          const caption =
            text === undefined || fontPath === undefined
              ? undefined
              : outlineText(join(located.dir, fontPath), text, frame.width * store.captionSize);
          outputs.push({
            kind: "png",
            path: `store/${app}/${locale}/${frame.id}/${name}.png`,
            width: frame.width,
            svg: storeFrameSvg({
              width: frame.width,
              height: frame.height,
              background,
              foreground,
              ...(caption === undefined ? {} : { caption }),
              screen: { href: `data:image/png;base64,${png.toString("base64")}`, ...size },
            }),
          });
        }
      }
    }
  return outputs;
}
