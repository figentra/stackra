/**
 * Stackra file contract:
 * Purpose: the policy table of resolveTheme (ADR 0340 decisions 2 to 5): a layer on the stackra theme is accepted and
 *          its changed colour's hex recomputed; the wrong parent, a locked path, a path the policy does not allow, a
 *          widened policy and an invalid value are refused; a failing accent is refused with the nearest passing
 *          colour; an accent near a status colour is accepted with notices that ask for icons and labels; an unsafe key
 *          changes nothing; and nothing throws.
 * Boundary: in-memory themes and layers only.
 * Runtime: node
 * Governing contract: ADR 0340 (one token engine); ADR 0022 (test placement).
 */
import type { LayerPolicy } from "#contracts/types/layer-policy.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import type { ThemeLayer } from "#contracts/types/theme-layer.type";
import type { ThemeVerdict } from "#contracts/types/theme-verdict.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { resolveTheme } from "#core/functions/resolve-theme.function";
import { themeNameOf } from "#core/functions/theme-name-of.function";

const layer = (changes: ThemeDiff, extra: Partial<ThemeLayer> = {}): ThemeLayer => ({
  id: "acme",
  name: "acme",
  extends: "stackra",
  changes,
  ...extra,
});

const BRAND: ThemeLayer = layer(
  {},
  {
    id: "brand",
    name: "brand",
    policy: {
      allow: ["colors.accent", "palette.accent-*"],
      lock: ["colors.danger*"],
      separate: [{ subject: "accent", from: ["danger", "warning", "success"] }],
    },
  },
);

const tenant = (changes: ThemeDiff, policy?: LayerPolicy): ThemeLayer =>
  layer(changes, {
    id: "ten_01HZX9",
    name: themeNameOf("ten_01HZX9"),
    extends: "brand",
    ...(policy ? { policy } : {}),
  });

const codes = (verdict: ThemeVerdict) =>
  verdict.accepted ? [] : verdict.findings.map((finding) => `${finding.code} ${finding.path}`);

describe("resolveTheme", () => {
  it("accepts a steel accent on stackra, names the theme after the layer and recomputes the hex", () => {
    const verdict = resolveTheme(STACKRA_THEME, [
      layer({ colors: { accent: { light: "oklch(0.5 0.12 248)", dark: "oklch(0.72 0.11 248)" } } }),
    ]);
    expect(verdict.accepted).toBe(true);
    if (!verdict.accepted) return;
    expect(verdict.theme.name).toBe("acme");
    expect(verdict.theme.colors.accent).toEqual({
      light: "oklch(0.5 0.12 248)",
      dark: "oklch(0.72 0.11 248)",
      hexLight: "#1C67A4",
      hexDark: "#6AAAE6",
    });
    expect(verdict.notices).toEqual([]);
    expect(verdict.requiresIconAndLabel).toBe(false);
  });

  it("refuses a layer whose parent is not the theme below", () => {
    expect(codes(resolveTheme(STACKRA_THEME, [layer({}, { extends: "other" })]))).toEqual([
      "wrong_parent extends",
    ]);
  });

  it("refuses a locked path, and a path the policy does not allow", () => {
    const danger = tenant({ colors: { danger: { light: "oklch(0.5 0.2 20)" } } });
    expect(codes(resolveTheme(STACKRA_THEME, [BRAND, danger]))).toEqual([
      "path_locked colors.danger.light",
    ]);
    const radius = tenant({ radius: { base: "1rem" } });
    expect(codes(resolveTheme(STACKRA_THEME, [BRAND, radius]))).toEqual([
      "path_not_allowed radius.base",
    ]);
  });

  it("refuses a policy that allows more than the one above", () => {
    expect(
      codes(resolveTheme(STACKRA_THEME, [BRAND, tenant({}, { allow: ["colors.*"] })])),
    ).toEqual(["policy_widened colors.*"]);
    expect(
      resolveTheme(STACKRA_THEME, [BRAND, tenant({}, { allow: ["palette.accent-soft"] })]).accepted,
    ).toBe(true);
  });

  it("binds the first layer by a root policy", () => {
    const verdict = resolveTheme(STACKRA_THEME, [layer({ radius: { base: "1rem" } })], {
      allow: ["colors.*"],
    });
    expect(codes(verdict)).toEqual(["path_not_allowed radius.base"]);
  });

  it("refuses a value the theme grammar refuses, without throwing", () => {
    const verdict = resolveTheme(STACKRA_THEME, [
      layer({ colors: { accent: { light: "red-ish" } } }),
    ]);
    expect(codes(verdict)).toEqual(["invalid_value colors.accent.light"]);
  });

  it("refuses an accent that fails its text, with the nearest passing colour and nothing applied", () => {
    const verdict = resolveTheme(STACKRA_THEME, [
      layer({ colors: { accent: { light: "oklch(0.8 0.12 248)", dark: "oklch(0.72 0.11 248)" } } }),
    ]);
    expect(verdict.accepted).toBe(false);
    if (verdict.accepted) return;
    expect(verdict.findings.map((finding) => [finding.code, finding.path, finding.mode])).toEqual([
      ["contrast_too_low", "accent-foreground", "light"],
    ]);
    expect(verdict.suggestions).toEqual({
      "colors.accent": {
        light: "oklch(0.545 0.12 248)",
        dark: "oklch(0.72 0.11 248)",
        hexLight: "#2C74B2",
        hexDark: "#6AAAE6",
      },
    });
  });

  it("accepts an accent near the warning colour, with notices that ask for icons and labels", () => {
    const orange = tenant({
      colors: { accent: { light: "oklch(0.5 0.15 50)", dark: "oklch(0.72 0.15 50)" } },
    });
    const verdict = resolveTheme(STACKRA_THEME, [BRAND, orange]);
    expect(verdict.accepted).toBe(true);
    if (!verdict.accepted) return;
    expect(verdict.requiresIconAndLabel).toBe(true);
    expect(verdict.notices.every((notice) => notice.code === "accent_not_separated")).toBe(true);
    expect(verdict.notices.some((notice) => notice.detail.includes("warning"))).toBe(true);
    expect(verdict.theme.name).toBe("ten-01hzx9");
  });

  it("drops an unsafe key instead of polluting the prototype", () => {
    const changes = JSON.parse('{"__proto__":{"polluted":true}}') as ThemeDiff;
    expect(resolveTheme(STACKRA_THEME, [layer(changes)]).accepted).toBe(true);
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });
});
