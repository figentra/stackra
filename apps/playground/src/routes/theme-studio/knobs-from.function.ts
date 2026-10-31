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

/** `{ [name]: value }`, or nothing when the value is not set. */
const optional = <Value>(name: string, value: Value | undefined) =>
  value === undefined ? {} : { [name]: value };

const STRENGTHS = ["none", "subtle", "medium", "strong"] as const;
const SKELETONS = ["shimmer", "pulse", "none"] as const;

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
  const spacing = numberIn(params.get("density"), 3, 5);
  const pill = params.get("pill");
  const field = params.get("field");
  const corner = params.get("corner");
  const flag = (name: string) => {
    const value = params.get(name);
    return value === "1" ? true : value === "0" ? false : undefined;
  };
  const strengths = (params.get("shadows") ?? "").split(",");
  const shadows = Object.fromEntries(
    (["surface", "overlay", "field"] as const).flatMap((role, index) => {
      const strength = STRENGTHS.find((value) => value === strengths[index]);
      return strength ? [[role, strength]] : [];
    }),
  );
  const skeleton = SKELETONS.find((value) => value === params.get("skel"));
  return {
    ...(params.get("name") ? { name: params.get("name") ?? undefined } : {}),
    ...(accentHue === undefined || accentChroma === undefined
      ? {}
      : { accent: { hue: accentHue, chroma: accentChroma } }),
    ...(neutralHue === undefined ? {} : { neutralHue }),
    ...(neutralChroma === undefined ? {} : { neutralChroma }),
    ...(radius === undefined ? {} : { radius }),
    ...(spacing === undefined ? {} : { spacing }),
    ...(pill === "1" || pill === "0" ? { pillControls: pill === "1" } : {}),
    ...(field === "bordered" || field === "lifted" ? { fieldStyle: field } : {}),
    ...(corner === "round" || corner === "squircle" ? { cornerShape: corner } : {}),
    ...optional("neutralTint", numberIn(params.get("tint"), 0, 1)),
    ...optional("vibrant", flag("vibrant")),
    ...optional("fontScale", numberIn(params.get("fscale"), 0.6, 1.4)),
    ...optional("lineHeight", numberIn(params.get("lh"), 0.8, 1.5)),
    ...optional("letterSpacing", numberIn(params.get("ls"), -0.05, 0.1)),
    ...optional("formsRadius", numberIn(params.get("forms"), 0, 3)),
    ...(Object.keys(shadows).length > 0 ? { shadows } : {}),
    ...optional("fieldBorderWidth", numberIn(params.get("fbw"), 0, 3)),
    ...optional("disabledOpacity", numberIn(params.get("dop"), 0.2, 0.8)),
    ...optional("cursorPointer", flag("cursor")),
    ...optional("skeleton", skeleton),
    ...optional("animations", flag("anim")),
    ...(font ? { fontSans: font.stack } : {}),
    ...(arabic ? { fontArabic: arabic.stack } : {}),
    ...(display ? { display } : {}),
    ...(displayArabic ? { displayArabic } : {}),
    ...(Object.keys(materials).length > 0 ? { materials } : {}),
  };
}
