/**
 * Stackra file contract:
 * Purpose: proves `useGlassButton` gives only the enabled quiet variants (secondary, tertiary, outline) a glass look,
 *          none while the material is solid or the button is disabled, and that the look is one regular, interactive
 *          `GlassView` in the colour scheme inside HeroUI Native's background layer, with the class that clears the
 *          variant's fill.
 * Boundary: React Native does not render in vitest, so react-native, heroui-native, expo-glass-effect and uniwind are
 *           replaced by stand-ins that render plain DOM, and the material decision by a stand-in each test sets; what
 *           reaches the native views is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0319 (decisions 2 and 3); ADR 0320 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { ButtonVariant } from "#contracts/enums/button-variant.enum";
import { useGlassButton } from "#native/glass/use-glass-button";

const state = vi.hoisted(() => ({
  material: "liquid" as "liquid" | "solid",
  scheme: "light",
  glass: {} as Record<string, unknown>,
}));

vi.mock("#native/glass/use-glass-material", () => ({ useGlassMaterial: () => state.material }));

vi.mock("heroui-native", () => ({
  Button: {
    Background: ({ children }: { children?: ReactNode }) => (
      <div data-testid="background">{children}</div>
    ),
  },
}));

vi.mock("expo-glass-effect", () => ({
  GlassView: (props: Record<string, unknown>) => {
    state.glass = props;
    return <div data-testid="liquid" />;
  },
}));

vi.mock("uniwind", () => ({ useUniwind: () => ({ theme: state.scheme }) }));

vi.mock("react-native", () => ({ StyleSheet: { absoluteFill: { position: "absolute" } } }));

const QUIET = ["secondary", "tertiary", "outline", "glass"] as const;
const SOLID = ButtonVariant.filter((variant) => !(QUIET as readonly string[]).includes(variant));

/** The look of `variant` under the current stand-in state. */
const lookOf = (variant: ButtonVariant, isDisabled?: boolean) =>
  renderHook(() => useGlassButton(variant, isDisabled)).result.current;

describe("useGlassButton", () => {
  beforeEach(() => {
    state.material = "liquid";
    state.scheme = "light";
    state.glass = {};
  });

  it.each(QUIET)("draws %s on Liquid Glass and clears its own fill", (variant) => {
    expect(lookOf(variant)).toMatchObject({ className: "bg-transparent" });
    expect(lookOf(variant)?.background).toBeTruthy();
  });

  it.each(SOLID)("leaves %s solid", (variant) => {
    expect(lookOf(variant)).toBeUndefined();
  });

  it.each(QUIET)("leaves a disabled %s solid, since HeroUI Native dims its root", (variant) => {
    expect(lookOf(variant, true)).toBeUndefined();
  });

  it("gives no variant glass while the material is solid", () => {
    state.material = "solid";
    for (const variant of ButtonVariant) expect(lookOf(variant)).toBeUndefined();
  });

  it.each(["light", "dark"] as const)(
    "draws one regular, interactive GlassView in the %s scheme inside the background layer",
    (scheme) => {
      state.scheme = scheme;
      const { container } = render(<>{lookOf("secondary")?.background}</>);
      expect(
        container.querySelector('[data-testid="background"] [data-testid="liquid"]'),
      ).toBeTruthy();
      expect(state.glass).toEqual({
        glassEffectStyle: "regular",
        colorScheme: scheme,
        isInteractive: true,
        style: { position: "absolute" },
      });
    },
  );

  it("reads any theme other than dark as the light scheme", () => {
    state.scheme = "stackra";
    render(<>{lookOf("outline")?.background}</>);
    expect(state.glass["colorScheme"]).toBe("light");
  });
});
