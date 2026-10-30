/**
 * Stackra file contract:
 * Purpose: proves the native BackToTop draws nothing above the threshold and, past it, a button that scrolls a scroll
 *          view (or a list, through `scrollToOffset`) to the top without animation under Reduce Motion.
 * Boundary: Reanimated and the IconButton are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { BackToTop } from "#native/back-to-top/back-to-top";

const state = vi.hoisted(() => ({ buttons: [] as Record<string, unknown>[] }));

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: ({ children }: Record<string, unknown>) =>
        createElement("div", null, children as never),
    },
    FadeIn: {},
    FadeOut: {},
    useReducedMotion: () => true,
  };
});
vi.mock("@stackra/icons/native/lucide-icons", () => ({ ArrowUp: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));

describe("BackToTop (native)", () => {
  beforeEach(() => {
    state.buttons = [];
  });

  it("hides above the threshold and scrolls a scroll view to the top", () => {
    const scrollTo = vi.fn();
    const ref = { current: { scrollTo } };
    const { rerender } = render(<BackToTop scrollRef={ref} offsetY={100} />);
    expect(state.buttons).toHaveLength(0);
    rerender(<BackToTop scrollRef={ref} offsetY={900} />);
    expect(state.buttons.at(-1)?.["label"]).toBe("Back to top");
    (state.buttons.at(-1)?.["onPress"] as () => void)?.();
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
  });

  it("scrolls a list through scrollToOffset", () => {
    const scrollToOffset = vi.fn();
    render(<BackToTop scrollRef={{ current: { scrollToOffset } }} offsetY={900} threshold={200} />);
    (state.buttons.at(-1)?.["onPress"] as () => void)?.();
    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: false });
  });
});
