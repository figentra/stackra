/**
 * Stackra file contract:
 * Purpose: proves the native material layer (ADR 0320 as amended 2026-10-31): `useMaterialRole` draws Liquid Glass
 *          for the glass roles where it runs, a blur in the front family on iOS before 26 and Android 12+, and the
 *          tonal solid in studio, on Android 11, in the solid mode and while transparency is not allowed; and
 *          `GlassSurface` draws each: a GlassView (clear over a dim at the label floor), a BlurView against the
 *          backdrop (solid on Android without one) or the solid surface with its tonal lift; `GlassGroup` merges on
 *          Liquid Glass; `MaterialBackdrop` hands Android's blur its target.
 * Boundary: React Native does not run in vitest, so react-native, expo-glass-effect, expo-blur, uniwind and
 *           heroui-native are stand-ins; the device's answers are state each test sets.
 * Runtime: node
 * Governing contract: ADR 0320; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import type { DesignSystemState } from "#contracts/types/design-system-state.type";

const device = vi.hoisted(() => ({
  os: "ios" as "ios" | "android",
  version: 18 as number,
  liquid: true,
  allowed: true,
}));

vi.mock("react-native", async () => {
  const { createElement: h } = await import("react");
  const box =
    (name: string) =>
    ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) =>
      h(
        "div",
        {
          "data-testid": name,
          "data-class": props["className"],
          "data-style": JSON.stringify(props["style"] ?? null),
        },
        children,
      );
  return {
    View: box("view"),
    Platform: {
      get OS() {
        return device.os;
      },
      get Version() {
        return device.version;
      },
    },
    StyleSheet: { absoluteFill: { position: "absolute" }, create: <T,>(styles: T) => styles },
  };
});

vi.mock("#native/glass/use-glass-material", () => ({
  useGlassMaterial: () => (device.liquid ? "liquid" : "solid"),
}));
vi.mock("#native/glass/use-transparency-allowed", () => ({
  useTransparencyAllowed: () => device.allowed,
}));

vi.mock("expo-glass-effect", async () => {
  const { createElement: h } = await import("react");
  return {
    GlassView: (props: Record<string, unknown>) =>
      h("i", {
        "data-testid": "glass",
        "data-style": String(props["glassEffectStyle"]),
        "data-interactive": String(props["isInteractive"]),
        "data-tint": String(props["tintColor"] ?? ""),
      }),
    GlassContainer: ({ children, spacing }: { children?: ReactNode; spacing?: number }) =>
      h("div", { "data-testid": "container", "data-spacing": spacing }, children),
  };
});

vi.mock("expo-blur", async () => {
  const { createElement: h } = await import("react");
  return {
    BlurView: (props: Record<string, unknown>) =>
      h("i", {
        "data-testid": "blur",
        "data-tint": String(props["tint"]),
        "data-method": String(props["blurMethod"]),
        "data-target": String(props["blurTarget"] !== undefined),
      }),
    BlurTargetView: ({ children }: { children?: ReactNode }) =>
      h("div", { "data-testid": "target" }, children),
  };
});

vi.mock("uniwind", () => ({ useUniwind: () => ({ theme: "light" }) }));
vi.mock("heroui-native", () => ({ useThemeColor: () => "#6a7a90" }));

const { useMaterialRole } = await import("#native/glass/use-material-role");
const { GlassSurface } = await import("#native/glass/glass-surface");
const { GlassGroup } = await import("#native/glass/glass-group");
const { MaterialBackdrop } = await import("#native/glass/material-backdrop");

/** A provider value with the given family and mode. */
const within =
  (family: string | undefined, material: string | undefined, context = DesignSystemContext) =>
  ({ children }: { children?: ReactNode }) =>
    createElement(
      context,
      { value: { family, material } as unknown as DesignSystemState },
      children,
    );

describe("useMaterialRole", () => {
  beforeEach(() => {
    device.os = "ios";
    device.version = 18;
    device.liquid = true;
    device.allowed = true;
  });

  it("draws Liquid Glass for the glass roles of either family, clear over media", () => {
    expect(
      renderHook(() => useMaterialRole("toast"), { wrapper: within("studio", "glass") }).result
        .current,
    ).toBe("liquid-regular");
    expect(
      renderHook(() => useMaterialRole("media-controls"), { wrapper: within("front", "glass") })
        .result.current,
    ).toBe("liquid-clear");
  });

  it("keeps studio content solid and front content on a blur where Liquid Glass is missing", () => {
    expect(
      renderHook(() => useMaterialRole("sidebar"), { wrapper: within("studio", "glass") }).result
        .current,
    ).toBe("solid");
    device.liquid = false;
    expect(
      renderHook(() => useMaterialRole("sidebar"), { wrapper: within("front", "glass") }).result
        .current,
    ).toBe("blur");
    // Studio never blurs: below Liquid Glass its chrome is the tonal solid.
    expect(
      renderHook(() => useMaterialRole("toast"), { wrapper: within("studio", "glass") }).result
        .current,
    ).toBe("solid");
  });

  it("blurs on Android 12 and later only", async () => {
    device.liquid = false;
    device.os = "android";
    device.version = 31;
    vi.resetModules();
    const fresh = (await import("#native/glass/use-material-role")).useMaterialRole;
    let context = (await import("#native/design-system-provider/design-system-context"))
      .DesignSystemContext;
    expect(
      renderHook(() => fresh("tab-bar"), { wrapper: within("front", "glass", context) }).result
        .current,
    ).toBe("blur");
    device.version = 30;
    vi.resetModules();
    const old = (await import("#native/glass/use-material-role")).useMaterialRole;
    context = (await import("#native/design-system-provider/design-system-context"))
      .DesignSystemContext;
    expect(
      renderHook(() => old("tab-bar"), { wrapper: within("front", "glass", context) }).result
        .current,
    ).toBe("solid");
  });

  it("is solid in the solid mode, while transparency is not allowed, and by the stackra default", () => {
    expect(
      renderHook(() => useMaterialRole("toast"), { wrapper: within("front", "solid") }).result
        .current,
    ).toBe("solid");
    device.allowed = false;
    expect(
      renderHook(() => useMaterialRole("toast"), { wrapper: within("front", "glass") }).result
        .current,
    ).toBe("solid");
    device.allowed = true;
    // No provider: the stackra theme's studio family in its solid default mode.
    expect(renderHook(() => useMaterialRole("toast")).result.current).toBe("solid");
  });
});

describe("GlassSurface", () => {
  beforeEach(() => {
    device.os = "ios";
    device.liquid = true;
    device.allowed = true;
  });

  it("draws interactive Liquid Glass with the accent tint when prominent", () => {
    const { getByTestId } = render(
      <GlassSurface material="fab" isInteractive isProminent>
        +
      </GlassSurface>,
      { wrapper: within("front", "glass") },
    );
    expect(getByTestId("glass").dataset).toMatchObject({
      style: "regular",
      interactive: "true",
      tint: "#6a7a90",
    });
  });

  it("puts clear glass over a black dim at the label floor when it holds a label", () => {
    const { getByTestId, getAllByTestId } = render(
      <GlassSurface material="media-controls" holdsLabel>
        0:42
      </GlassSurface>,
      { wrapper: within("front", "glass") },
    );
    expect(getByTestId("glass").dataset["style"]).toBe("clear");
    expect(
      getAllByTestId("view").some((view) => view.dataset["style"]?.includes("rgba(0, 0, 0, 0.55)")),
    ).toBe(true);
  });

  it("blurs in the front family below Liquid Glass, and on Android only against a backdrop", () => {
    device.liquid = false;
    const ios = render(<GlassSurface material="nav-bar">Title</GlassSurface>, {
      wrapper: within("front", "glass"),
    });
    expect(ios.getByTestId("blur").dataset).toMatchObject({
      tint: "systemMaterialLight",
      method: "dimezisBlurViewSdk31Plus",
      target: "false",
    });
    ios.unmount();
    device.os = "android";
    const bare = render(<GlassSurface material="nav-bar">Title</GlassSurface>, {
      wrapper: within("front", "glass"),
    });
    expect(bare.queryByTestId("blur")).toBeNull();
    bare.unmount();
    const backed = render(
      <MaterialBackdrop>
        <GlassSurface material="nav-bar">Title</GlassSurface>
      </MaterialBackdrop>,
      { wrapper: within("front", "glass") },
    );
    expect(backed.getByTestId("target")).toBeTruthy();
    expect(backed.getByTestId("blur").dataset["target"]).toBe("true");
  });

  it("draws the tonal solid: the role's surface with the accent lift, and a black plate under media", () => {
    const { getAllByTestId, unmount } = render(<GlassSurface material="menu">Copy</GlassSurface>, {
      wrapper: within("studio", "solid"),
    });
    const views = getAllByTestId("view");
    expect(views[0]?.dataset["class"]).toBe("bg-overlay");
    expect(views.some((view) => view.dataset["class"] === "bg-accent")).toBe(true);
    unmount();
    const media = render(<GlassSurface material="media-controls">Play</GlassSurface>, {
      wrapper: within("studio", "solid"),
    });
    expect(media.getAllByTestId("view")[0]?.dataset["style"]).toContain("rgba(0, 0, 0, 0.8)");
  });

  it("groups glass siblings in a GlassContainer only on Liquid Glass", () => {
    const merged = render(<GlassGroup spacing={12}>a</GlassGroup>);
    expect(merged.getByTestId("container").dataset["spacing"]).toBe("12");
    merged.unmount();
    device.liquid = false;
    const plain = render(<GlassGroup>a</GlassGroup>);
    expect(plain.queryByTestId("container")).toBeNull();
  });
});
