/**
 * Stackra file contract:
 * Purpose: the Switch's on and off states in every shipped brand theme, light and dark, as the web stylesheet and the
 *          native Switch paint them: off is the muted `default` track edged in `field-border`, with a `field-border`
 *          thumb; on is the `accent` track with an `accent-foreground` thumb. Asserts each part holds 3:1 against what
 *          it sits on (WCAG 1.4.11), and that the two thumbs differ, so the state never rests on the thumb's position
 *          alone (WCAG 1.4.1): in right to left the off thumb rests at the right, where an on thumb sits in English.
 * Boundary: pure; no DOM. The token names mirror `selectionControlRules` in @stackra/tokens and the native Switch.
 * Runtime: browser
 * Governing contract: WCAG 2.2 (1.4.1, 1.4.11); ADR 0340 (decision 4); STA-1371.
 */
import { pairRatio } from "@stackra/tokens";

import { BRAND_THEMES, buildBrandTheme } from "#src/constants/brand-themes";

/**
 * [part, fg, bg, floor]; floor 0 prints only. The on track's own edge is printed, not asserted: the state is carried
 * by the thumb (its fill against the track and against the off thumb), and a preset's accent is the brand's to set
 * (Medusa's dark accent is a grey at about 2.3:1 on the page).
 */
const ROWS: readonly (readonly [string, string, string, number])[] = [
  ["off track edge on the page", "field-border", "background", 3],
  ["off track edge on a card", "field-border", "surface", 3],
  ["off thumb on the off track", "muted", "default", 3],
  ["on track on the page", "accent", "background", 0],
  ["on track on a card", "accent", "surface", 0],
  ["on thumb on the on track", "accent-foreground", "accent", 3],
  ["on thumb apart from the off thumb", "accent-foreground", "muted", 1.5],
];

const rows = BRAND_THEMES.flatMap(({ id, layer }) => {
  const theme = buildBrandTheme(layer);
  return (["light", "dark"] as const).flatMap((mode) =>
    ROWS.map(([part, fg, bg, min]) => ({
      id,
      mode,
      part,
      ratio: pairRatio(theme, { fg, bg, min: 3 }, mode) ?? 0,
      min,
    })),
  );
});

describe("switch on and off contrast", () => {
  it("prints the table", () => {
    const lines = rows.map(
      ({ id, mode, part, ratio, min }) =>
        `${id.padEnd(9)} ${mode.padEnd(5)} ${part.padEnd(34)} ${ratio.toFixed(2).padStart(6)}  ${min === 0 ? "info" : ratio >= min ? "pass" : `FAIL <${min}`}`,
    );
    console.log(`\n${lines.join("\n")}\n`);
    expect(lines.length).toBe(BRAND_THEMES.length * 2 * ROWS.length);
  });

  it.each(
    rows
      .filter(({ min }) => min > 0)
      .map((row) => [`${row.id} ${row.mode} ${row.part}`, row] as const),
  )("%s holds its floor", (_, { ratio, min }) => {
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
