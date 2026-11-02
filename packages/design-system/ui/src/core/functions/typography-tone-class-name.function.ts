/**
 * Stackra file contract:
 * Purpose: the colour class of a Text or Heading tone on web or native, including `core`: large headings (looks h1
 *          to h4) draw `text-core`, everything smaller `text-core-strong`, so small core text keeps 4.5:1 (brand
 *          rules §39; STA-2016).
 * Boundary: class names only; the utilities come from the theme (`--color-core`, `--color-core-strong`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7).
 */
import type { TypographyTone } from "#contracts/enums/typography-tone.enum";
import { NATIVE_TONE_CLASS_NAME } from "#core/constants/native-tone-class-name.constant";
import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";

/** The heading looks that are large text (24 px, or 18.66 px bold, and up), where the core passes at 3:1. */
const LARGE_TYPES: ReadonlySet<string> = new Set(["h1", "h2", "h3", "h4"]);

/** The class that colours `tone` for a text of look `type` on `runtime`; native classes win over HeroUI's colour. */
export function typographyToneClassName(
  tone: TypographyTone,
  type: string,
  runtime: "web" | "native",
): string {
  if (tone !== "core")
    return runtime === "web" ? TONE_CLASS_NAME[tone] : NATIVE_TONE_CLASS_NAME[tone];
  const name = LARGE_TYPES.has(type) ? "text-core" : "text-core-strong";
  return runtime === "web" ? name : `!${name}`;
}
