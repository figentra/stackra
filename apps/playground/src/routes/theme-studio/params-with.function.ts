/**
 * Stackra file contract:
 * Purpose: `paramsWith`: search params with the studio knobs written in and every other param (the shell's scheme and
 *          locale) kept.
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio: a link opens the same theme).
 */
import { MaterialLevel } from "@stackra/tokens/contracts";

import { STUDIO_FACES, type StudioKnobs } from "#src/components/studio-controls";

import { STUDIO_PARAMS } from "./studio-params.constant";

/** `params` with `knobs` written in. */
export function paramsWith(params: URLSearchParams, knobs: StudioKnobs): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const name of STUDIO_PARAMS) next.delete(name);
  const put = (name: (typeof STUDIO_PARAMS)[number], value: string | number | undefined) => {
    if (value !== undefined) next.set(name, String(value));
  };
  put("name", knobs.name);
  put("accent", knobs.accent ? `${knobs.accent.hue},${knobs.accent.chroma}` : undefined);
  put("hue", knobs.neutralHue);
  put("tint", knobs.neutralChroma);
  put("radius", knobs.radius);
  put("font", STUDIO_FACES.latin.find(({ stack }) => stack === knobs.fontSans)?.id);
  put("arabic", STUDIO_FACES.arabic.find(({ stack }) => stack === knobs.fontArabic)?.id);
  put("display", knobs.display);
  put("display-ar", knobs.displayArabic);
  const blurs = MaterialLevel.map((level) => knobs.materials?.[level]?.blur);
  put(
    "blur",
    blurs.some((blur) => blur !== undefined)
      ? blurs.map((blur) => blur ?? "").join(",")
      : undefined,
  );
  return next;
}
