/**
 * Stackra file contract:
 * Purpose: `storeFrameSvg(frame)`, one store-screenshot frame: the frame colour, the caption centred in the top band
 *          (shrunk to fit nine tenths of the width), and the captured screen below it, fitted to the space left with
 *          its aspect kept and its corners rounded.
 * Boundary: pure. The caption arrives outlined (no live text, so no font is needed to render it) and the screen as a
 *           PNG data URI; colours are values the caller took from the theme.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 7: the brand kit adds frames and captions to captured screens).
 */
import type { TextOutline } from "#contracts/types/text-outline.type";

/** The caption band's share of the frame's height. */
const BAND = 0.2;

/** The margin below the screen as a share of the height, and beside it as a share of the width. */
const MARGIN = { bottom: 0.04, side: 0.08 };

/** Two decimals, for stable output. */
const fixed = (value: number): string => String(Math.round(value * 100) / 100);

/**
 * The SVG of one frame.
 *
 * @param frame.width - the frame's width in pixels.
 * @param frame.height - the frame's height in pixels.
 * @param frame.background - the frame colour.
 * @param frame.foreground - the caption colour.
 * @param frame.caption - the outlined caption; no caption band text when absent.
 * @param frame.screen - the captured screen: its PNG data URI and pixel size.
 * @example
 * storeFrameSvg({ width: 1320, height: 2868, background: "#1F4FD1", foreground: "#FFFFFF", caption, screen });
 */
export function storeFrameSvg(frame: {
  readonly width: number;
  readonly height: number;
  readonly background: string;
  readonly foreground: string;
  readonly caption?: TextOutline;
  readonly screen: { readonly href: string; readonly width: number; readonly height: number };
}): string {
  const { width, height } = frame;
  const band = height * BAND;
  let caption = "";
  if (frame.caption !== undefined) {
    const { box, d } = frame.caption;
    const inkWidth = Math.max(box.x2 - box.x1, 1);
    const scale = Math.min(1, (width * 0.9) / inkWidth);
    const x = (width - inkWidth * scale) / 2 - box.x1 * scale;
    const y = band / 2 - ((box.y1 + box.y2) / 2) * scale;
    caption = `<path fill="${frame.foreground}" transform="translate(${fixed(x)} ${fixed(y)}) scale(${fixed(scale)})" d="${d}"/>`;
  }
  const roomWidth = width * (1 - 2 * MARGIN.side);
  const roomHeight = height - band - height * MARGIN.bottom;
  const fit = Math.min(roomWidth / frame.screen.width, roomHeight / frame.screen.height);
  const screenWidth = frame.screen.width * fit;
  const screenHeight = frame.screen.height * fit;
  const left = (width - screenWidth) / 2;
  const radius = screenWidth * 0.06;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="${frame.background}"/>` +
    caption +
    `<clipPath id="screen"><rect x="${fixed(left)}" y="${fixed(band)}" width="${fixed(screenWidth)}" height="${fixed(screenHeight)}" rx="${fixed(radius)}"/></clipPath>` +
    `<image clip-path="url(#screen)" x="${fixed(left)}" y="${fixed(band)}" width="${fixed(screenWidth)}" height="${fixed(screenHeight)}" href="${frame.screen.href}"/>` +
    `</svg>\n`
  );
}
