/**
 * Stackra file contract:
 * Purpose: proves the native VisuallyHidden is a Text clipped to one transparent point out of the layout, never
 *          hidden by opacity or display, and passes its Text props through.
 * Boundary: `react-native` is replaced by stand-ins that render plain DOM and record their props.
 * Runtime: node
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { VisuallyHidden } from "#native/visually-hidden/visually-hidden";

const state = vi.hoisted(() => ({ text: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    StyleSheet: { create: <T,>(styles: T) => styles },
    Text: (props: Record<string, unknown>) => {
      state.text = props;
      return createElement("span", null, props["children"] as never);
    },
  };
});

describe("VisuallyHidden (native)", () => {
  it("is one transparent point out of the layout, still in the reading order", () => {
    const { container } = render(
      <VisuallyHidden testID="count">3 items in the cart</VisuallyHidden>,
    );
    expect(container.textContent).toBe("3 items in the cart");
    expect(state.text["style"]).toEqual({
      position: "absolute",
      width: 1,
      height: 1,
      overflow: "hidden",
      color: "transparent",
    });
    expect(state.text["style"]).not.toHaveProperty("opacity");
    expect(state.text["testID"]).toBe("count");
  });
});
