/**
 * Stackra file contract:
 * Purpose: proves the native Bidi wraps an inline run in the isolate marks of its direction inside a nested Text,
 *          sets a block's Yoga direction and hands it to `useDirection` below, leaves an `auto` block alone, and that
 *          `useDirection` falls back from the block to the provider to React Native's own direction.
 * Boundary: React Native does not render in vitest, so `react-native` is replaced by stand-ins that render plain DOM
 *           and record their props; the design system context is the real one.
 * Runtime: node
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { Bidi } from "#native/bidi/bidi";
import { useDirection } from "#native/bidi/use-direction";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[], isRTL: false }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-testid": "text" }, props["children"] as never),
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", { "data-testid": "view" }, props["children"] as never);
    },
    I18nManager: {
      get isRTL() {
        return state.isRTL;
      },
    },
  };
});

/** Writes the direction it reads. */
function Probe() {
  return <output>{useDirection()}</output>;
}

describe("Bidi (native)", () => {
  beforeEach(() => {
    state.views = [];
    state.isRTL = false;
  });

  it("wraps an inline run in the isolate marks of its direction", () => {
    const { rerender } = render(<Bidi>SKU-104</Bidi>);
    expect(screen.getByTestId("text").textContent).toBe("⁨SKU-104⁩");
    rerender(<Bidi dir="ltr">+966 55 123 4567</Bidi>);
    expect(screen.getByTestId("text").textContent).toBe("⁦+966 55 123 4567⁩");
  });

  it("sets a block's direction, for layout and for useDirection below it", () => {
    render(
      <Bidi isBlock dir="rtl" style={{ padding: 4 }}>
        <Probe />
      </Bidi>,
    );
    expect(state.views.at(-1)?.["style"]).toEqual([{ direction: "rtl" }, { padding: 4 }]);
    expect(screen.getByRole("status").textContent).toBe("rtl");
  });

  it("leaves an auto block's direction alone", () => {
    render(
      <Bidi isBlock>
        <Probe />
      </Bidi>,
    );
    expect(state.views.at(-1)?.["style"]).toBeUndefined();
    expect(screen.getByRole("status").textContent).toBe("ltr");
  });

  it("reads the provider's direction, then React Native's", () => {
    const { rerender } = render(
      <DesignSystemContext value={{ direction: "rtl" } as DesignSystemState}>
        <Probe />
      </DesignSystemContext>,
    );
    expect(screen.getByRole("status").textContent).toBe("rtl");
    state.isRTL = true;
    rerender(<Probe />);
    expect(screen.getByRole("status").textContent).toBe("rtl");
  });
});
