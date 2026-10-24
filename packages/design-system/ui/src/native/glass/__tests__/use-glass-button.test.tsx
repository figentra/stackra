/**
 * Stackra file contract:
 * Purpose: proves `useGlassButton` gives only the quiet variants (secondary, tertiary, outline) a glass look, none
 *          while the material is solid, draws Liquid Glass at the regular style where the platform has it, and
 *          otherwise a blur tinted to the colour scheme under the theme's `surface` at the regular level's fill share.
 * Boundary: React Native does not render in vitest, so react-native, heroui-native, expo-blur, expo-glass-effect and
 *          uniwind are replaced by stand-ins that render plain DOM, and the material decision by a stand-in each test
 *          sets; what reaches the native views is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0319 (decisions 2 and 3); ADR 0320 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { MATERIAL_MODES, STACKRA_THEME } from "@stackra/tokens";
import { render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { ButtonVariant } from "#contracts/enums/button-variant.enum";
import { useGlassButton } from "#native/glass/use-glass-button";

const state = vi.hoisted(() => ({
  material: "glass" as "liquid" | "glass" | "solid",
  scheme: "light",
}));

vi.mock("#native/glass/use-glass-material", () => ({ useGlassMaterial: () => state.material }));

vi.mock("heroui-native", () => ({
  Button: {
    Background: ({ children }: { children?: ReactNode }) => (
      <div data-testid="background">{children}</div>
    ),
  },
  useThemeColor: (name: string) => `color:${name}`,
}));

vi.mock("expo-blur", () => ({
  BlurView: ({ tint, children }: { tint?: string; children?: ReactNode }) => (
    <div data-testid="blur" data-tint={tint}>
      {children}
    </div>
  ),
}));

vi.mock("expo-glass-effect", () => ({
  GlassView: ({ glassEffectStyle }: { glassEffectStyle?: string }) => (
    <div data-testid="liquid" data-style={glassEffectStyle} />
  ),
}));

vi.mock("uniwind", () => ({ useUniwind: () => ({ theme: state.scheme }) }));

vi.mock("react-native", () => ({
  StyleSheet: { absoluteFill: { position: "absolute" } },
  View: ({ style }: { style?: unknown }) => (
    <div data-testid="fill" data-style={JSON.stringify(style)} />
  ),
}));

const QUIET = ["secondary", "tertiary", "outline"] as const;
const SOLID = ButtonVariant.filter((variant) => !(QUIET as readonly string[]).includes(variant));

/** The look of `variant` under the current stand-in state. */
const lookOf = (variant: ButtonVariant) => renderHook(() => useGlassButton(variant)).result.current;

/** Renders the layer of `variant`'s look and returns its container. */
const layerOf = (variant: ButtonVariant) => render(<>{lookOf(variant)?.background}</>).container;

/** The regular level's fill share in `scheme`, as the glass mode writes it. */
const regularFill = (scheme: "light" | "dark") =>
  Math.max(
    MATERIAL_MODES.glass.fillFloor,
    STACKRA_THEME.materials.levels.regular.fill[scheme] * MATERIAL_MODES.glass.fillScale,
  );

describe("useGlassButton", () => {
  beforeEach(() => {
    state.material = "glass";
    state.scheme = "light";
  });

  it.each(QUIET)("draws %s on glass and clears its own fill", (variant) => {
    for (const material of ["glass", "liquid"] as const) {
      state.material = material;
      expect(lookOf(variant)).toMatchObject({ className: "bg-transparent" });
      expect(lookOf(variant)?.background).toBeTruthy();
    }
  });

  it.each(SOLID)("leaves %s solid", (variant) => {
    expect(lookOf(variant)).toBeUndefined();
  });

  it("gives no variant glass while the material is solid", () => {
    state.material = "solid";
    for (const variant of ButtonVariant) expect(lookOf(variant)).toBeUndefined();
  });

  it("draws Liquid Glass at the regular style inside HeroUI Native's background layer", () => {
    state.material = "liquid";
    const container = layerOf("secondary");
    const liquid = container.querySelector('[data-testid="background"] [data-testid="liquid"]');
    expect(liquid?.getAttribute("data-style")).toBe("regular");
    expect(container.querySelector('[data-testid="blur"]')).toBeNull();
  });

  it.each(["light", "dark"] as const)(
    "draws a %s blur under the surface at the regular fill share elsewhere",
    (scheme) => {
      state.scheme = scheme;
      const container = layerOf("outline");
      const blur = container.querySelector('[data-testid="background"] [data-testid="blur"]');
      expect(blur?.getAttribute("data-tint")).toBe(scheme);
      const fill = JSON.parse(
        blur?.querySelector('[data-testid="fill"]')?.getAttribute("data-style") ?? "[]",
      ) as unknown[];
      expect(fill).toEqual([
        { position: "absolute" },
        { backgroundColor: "color:surface", opacity: regularFill(scheme) },
      ]);
      expect(container.querySelector('[data-testid="liquid"]')).toBeNull();
    },
  );
});
