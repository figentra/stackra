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

/** The roles a shadow strength is set for, in the `shadows` parameter's order. */
const SHADOW_ROLES = ["surface", "overlay", "field"] as const;

/** A switch as `1` or `0`, or nothing when it is left to the theme. */
const flag = (value: boolean | undefined) => (value === undefined ? undefined : value ? 1 : 0);

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
  put("density", knobs.spacing);
  put("pill", knobs.pillControls === undefined ? undefined : knobs.pillControls ? 1 : 0);
  put("field", knobs.fieldStyle);
  put("corner", knobs.cornerShape);
  put("tint", knobs.neutralTint);
  put("vibrant", flag(knobs.vibrant));
  put("fscale", knobs.fontScale);
  put("lh", knobs.lineHeight);
  put("ls", knobs.letterSpacing);
  put("forms", knobs.formsRadius);
  put(
    "shadows",
    knobs.shadows ? SHADOW_ROLES.map((role) => knobs.shadows?.[role] ?? "").join(",") : undefined,
  );
  put("fbw", knobs.fieldBorderWidth);
  put("dop", knobs.disabledOpacity);
  put("cursor", flag(knobs.cursorPointer));
  put("skel", knobs.skeleton);
  put("anim", flag(knobs.animations));
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
