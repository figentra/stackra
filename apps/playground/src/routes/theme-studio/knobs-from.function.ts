/**
 * Stackra file contract:
 * Purpose: `knobsFrom`: the studio knobs a set of search params holds; anything unreadable is left out, numbers are
 *          clamped to their control's range and faces must be ones the controls offer.
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio: a link opens the same theme).
 */
import { MaterialLevel } from "@stackra/tokens/contracts";

import { STUDIO_FACES, type StudioKnobs } from "#src/components/studio-controls";

const numberIn = (value: string | null | undefined, min: number, max: number) => {
  if (value === null || value === undefined || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : undefined;
};

/** The knobs `params` holds. */
export function knobsFrom(params: URLSearchParams): StudioKnobs {
  const [hue, chroma] = (params.get("accent") ?? "").split(",");
  const accentHue = numberIn(hue, 0, 360);
  const accentChroma = numberIn(chroma, 0, 0.37);
  const font = STUDIO_FACES.latin.find(({ id }) => id === params.get("font"));
  const arabic = STUDIO_FACES.arabic.find(({ id }) => id === params.get("arabic"));
  const display = STUDIO_FACES.display.find((family) => family === params.get("display"));
  const displayArabic = STUDIO_FACES.displayArabic.find(
    (family) => family === params.get("display-ar"),
  );
  const blurs = (params.get("blur") ?? "").split(",");
  const materials = Object.fromEntries(
    MaterialLevel.flatMap((level, index) => {
      const blur = numberIn(blurs[index], 0, 48);
      return blur === undefined ? [] : [[level, { blur }]];
    }),
  );
  const neutralHue = numberIn(params.get("hue"), 0, 360);
  const neutralChroma = numberIn(params.get("tint"), 0, 0.03);
  const radius = numberIn(params.get("radius"), 0, 48);
  return {
    ...(params.get("name") ? { name: params.get("name") ?? undefined } : {}),
    ...(accentHue === undefined || accentChroma === undefined
      ? {}
      : { accent: { hue: accentHue, chroma: accentChroma } }),
    ...(neutralHue === undefined ? {} : { neutralHue }),
    ...(neutralChroma === undefined ? {} : { neutralChroma }),
    ...(radius === undefined ? {} : { radius }),
    ...(font ? { fontSans: font.stack } : {}),
    ...(arabic ? { fontArabic: arabic.stack } : {}),
    ...(display ? { display } : {}),
    ...(displayArabic ? { displayArabic } : {}),
    ...(Object.keys(materials).length > 0 ? { materials } : {}),
  };
}
