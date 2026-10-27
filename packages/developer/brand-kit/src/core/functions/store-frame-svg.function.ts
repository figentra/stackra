/**
 * Stackra file contract:
 * Purpose: `storeFrameSvg`, the SVG of one store screenshot: the theme accent as the canvas, the caption set in the
 *          theme's sans (Arabic) family at the top, and the captured screen (or an empty surface) in a rounded frame
 *          below it.
 * Boundary: pure; the caption is escaped, the screenshot is embedded as a PNG data URL. Layout ratios are fixed here;
 *           sizes come from `DEVICE_FRAMES`.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: D19 store frames and captions from assets/store).
 */
import { escapeXml } from "@stackra/support";

import { wrapCaption } from "#core/functions/wrap-caption.function";
import type { StoreFrameContent } from "#core/types/store-frame-content.type";

/**
 * The frame's SVG.
 *
 * @example
 * const svg = storeFrameSvg({ theme, frame: DEVICE_FRAMES[0], locale: "en", caption: "One scan away" });
 */
export function storeFrameSvg({
  theme,
  frame,
  locale,
  caption,
  screenshot,
}: StoreFrameContent): string {
  const { width, height, radius } = frame;
  const rtl = /^(ar|fa|he|ur)(-|$)/i.test(locale);
  const family = escapeXml(rtl ? theme.fontFamily.arabic : theme.fontFamily.sans);
  const fontSize = Math.round(width * 0.06);
  const lines = wrapCaption(caption, Math.max(8, Math.floor((width * 0.84) / (fontSize * 0.55))));
  const screen = {
    x: Math.round(width * 0.08),
    y: Math.round(height * 0.2),
    w: Math.round(width * 0.84),
  };
  const screenHeight = height - screen.y;
  const text = lines
    .map(
      (line, index) =>
        `<text x="${width / 2}" y="${Math.round(height * 0.06 + fontSize * (index + 1) * 1.2)}" text-anchor="middle"${rtl ? ' direction="rtl"' : ""}>${escapeXml(line)}</text>`,
    )
    .join("");
  const fill = screenshot
    ? `<image href="data:image/png;base64,${Buffer.from(screenshot).toString("base64")}" x="${screen.x}" y="${screen.y}" width="${screen.w}" height="${screenHeight}" preserveAspectRatio="xMidYMin slice" clip-path="url(#screen)"/>`
    : `<rect x="${screen.x}" y="${screen.y}" width="${screen.w}" height="${screenHeight}" rx="${radius}" fill="${theme.colors.surface.hexLight}"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs><clipPath id="screen"><rect x="${screen.x}" y="${screen.y}" width="${screen.w}" height="${screenHeight + radius}" rx="${radius}"/></clipPath></defs>`,
    `<rect width="${width}" height="${height}" fill="${theme.colors.accent.hexLight}"/>`,
    `<g font-family="${family}" font-size="${fontSize}" font-weight="600" fill="${theme.colors["accent-foreground"].hexLight}">${text}</g>`,
    fill,
    "</svg>",
  ].join("");
}
