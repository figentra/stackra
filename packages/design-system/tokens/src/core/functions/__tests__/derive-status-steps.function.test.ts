/**
 * Stackra file contract:
 * Purpose: unit tests of `deriveStatusSteps`: each status hover steps away from its label, so it reads at least as well
 *          as the fill in both schemes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0340 (decision 4); WCAG 2.2 (1.4.3).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { deriveStatusSteps } from "#core/functions/derive-status-steps.function";

describe("deriveStatusSteps", () => {
  it.each(
    ["success", "warning", "danger"].flatMap((role) =>
      (["light", "dark"] as const).map((mode) => [role, mode] as const),
    ),
  )("keeps %s's hover at least as readable as its fill in %s", (role, mode) => {
    const hover = deriveStatusSteps(STACKRA_THEME).palette?.[`${role}-hover`];
    const colors = STACKRA_THEME.colors as Record<string, { hexLight: string; hexDark: string }>;
    const hex = (name: string) =>
      (mode === "light" ? colors[name]?.hexLight : colors[name]?.hexDark) ?? "";
    const label = hex(`${role}-foreground`);
    const step = (mode === "light" ? hover?.hexLight : hover?.hexDark) ?? "";
    expect(contrastRatio(label, step)).toBeGreaterThanOrEqual(contrastRatio(label, hex(role)));
  });
});
