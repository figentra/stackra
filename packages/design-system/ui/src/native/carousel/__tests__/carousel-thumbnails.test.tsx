/**
 * Stackra file contract:
 * Purpose: proves the native Carousel draws a pressable thumbnail per slide in place of the dots, the current one
 *          selected, and that pressing one pages the scroll view to it.
 * Boundary: React Native, Reanimated and the IconButton are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";

import { Carousel } from "#native/carousel/carousel";

const state = vi.hoisted(() => ({ scrolled: [] as unknown[], images: 0 }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: ({ children }: Record<string, unknown>) => createElement("div", null, children as never),
    ScrollView: forwardRef(({ children }: Record<string, unknown>, ref) => {
      useImperativeHandle(ref, () => ({ scrollTo: (to: unknown) => state.scrolled.push(to) }));
      return createElement("div", null, children as never);
    }),
    Image: () => {
      state.images += 1;
      return null;
    },
    Pressable: ({
      children,
      onPress,
      accessibilityLabel,
      accessibilityState,
    }: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          onClick: onPress,
          "aria-label": accessibilityLabel,
          "aria-pressed": (accessibilityState as { selected?: boolean } | undefined)?.selected,
        },
        children as never,
      ),
  };
});
vi.mock("react-native-reanimated", () => ({ useReducedMotion: () => true }));
vi.mock("#native/icon-button/icon-button", () => ({ IconButton: () => null }));

describe("Carousel (native)", () => {
  it("draws thumbnails and pages to the pressed one", () => {
    render(
      <Carousel label="Photos" thumbnails={["/a.jpg", "/b.jpg"]}>
        {[<span key="a">A</span>, <span key="b">B</span>]}
      </Carousel>,
    );
    expect(state.images).toBe(2);
    expect(screen.getByRole("button", { name: "Slide 1 of 2" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Slide 2 of 2" }));
    expect(state.scrolled).toHaveLength(1);
  });
});
