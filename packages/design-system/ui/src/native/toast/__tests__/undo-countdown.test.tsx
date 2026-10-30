/**
 * Stackra file contract:
 * Purpose: proves the native `UndoCountdown` shows the whole seconds left (rounded up), counts down once a second,
 *          stops at zero, stops its timer on unmount, and is hidden from assistive technology.
 * Boundary: React Native and the Text are recording stand-ins that render plain DOM; the clock is faked.
 * Runtime: node
 * Governing contract: WCAG 2.2 SC 2.2.1; ADR 0329; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { UndoCountdown } from "#native/toast/undo-countdown";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

describe("UndoCountdown (native)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.views = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts the seconds left down to zero and no further", () => {
    const { container } = render(<UndoCountdown duration={2500} />);
    expect(container.textContent).toBe("3");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toBe("2");
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.textContent).toBe("0");
  });

  it("is hidden from assistive technology", () => {
    render(<UndoCountdown duration={1000} />);
    expect(state.views[0]).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  it("clears its timer on unmount", () => {
    const { unmount } = render(<UndoCountdown duration={3000} />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
