/**
 * Stackra file contract:
 * Purpose: proves the native Lightbox follows a swipe to the page it settles on (reporting only a real change), pages
 *          its scroll view with animation unless Reduce Motion is on, fades in only without Reduce Motion, clamps an
 *          out-of-range index, opens from its default and closes itself from the Android back button, and ignores a
 *          swipe before the window has a width.
 * Boundary: React Native, Reanimated and the IconButton are recording stand-ins that render plain DOM; the paging
 *           scroll view records its `scrollTo` calls and hands its props to the test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";

import { Lightbox } from "#native/lightbox/lightbox";

const state = vi.hoisted(() => ({
  isReduced: false,
  width: 400,
  modal: {} as Record<string, unknown>,
  pagers: [] as Record<string, unknown>[],
  scrolled: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box =
    (tag: string) =>
    ({ children, accessibilityLabel }: Record<string, unknown>) =>
      createElement(tag, { "aria-label": accessibilityLabel }, children as never);
  return {
    View: box("div"),
    Text: box("span"),
    ScrollView: forwardRef((props: Record<string, unknown>, ref) => {
      useImperativeHandle(ref, () => ({ scrollTo: (to: unknown) => state.scrolled.push(to) }));
      if (props["pagingEnabled"]) state.pagers.push(props);
      return createElement("div", null, props["children"] as never);
    }),
    Image: ({ accessibilityLabel }: Record<string, unknown>) =>
      createElement("img", { alt: accessibilityLabel }),
    Modal: (props: Record<string, unknown>) => {
      state.modal = props;
      return props["visible"] ? createElement("section", null, props["children"] as never) : null;
    },
    useWindowDimensions: () => ({ width: state.width, height: 800 }),
  };
});
vi.mock("react-native-reanimated", () => ({ useReducedMotion: () => state.isReduced }));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: ({ label, onPress, isDisabled }: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: onPress, disabled: isDisabled },
        label as never,
      ),
  };
});

const IMAGES = [
  { id: "a", src: "/a.jpg", alt: "Latte" },
  { id: "b", src: "/b.jpg", alt: "Croissant", caption: "Fresh croissant" },
  { id: "c", src: "/c.jpg", alt: "Dates" },
];

/** The paging scroll view's last props. */
const pager = (): Record<string, unknown> => state.pagers.at(-1) ?? {};

/** Ends a swipe at horizontal offset `x`. */
const swipeTo = (x: number): void =>
  act(() =>
    (pager()["onMomentumScrollEnd"] as (event: unknown) => void)({
      nativeEvent: { contentOffset: { x } },
    }),
  );

describe("Lightbox swipe (native)", () => {
  beforeEach(() => {
    state.isReduced = false;
    state.width = 400;
    state.scrolled = [];
  });

  it("follows a swipe and pages with animation", () => {
    const onIndexChange = vi.fn();
    render(<Lightbox images={IMAGES} isOpen onIndexChange={onIndexChange} />);
    expect(state.modal["animationType"]).toBe("fade");
    swipeTo(810);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByText("3 of 3")).toBeTruthy();
    expect(pager()["contentOffset"]).toEqual({ x: 800, y: 0 });
    onIndexChange.mockClear();
    swipeTo(790);
    expect(onIndexChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(state.scrolled).toEqual([{ x: 400, animated: true }]);
    expect(screen.getByText("Fresh croissant")).toBeTruthy();
  });

  it("ignores a swipe before the window has a width", () => {
    state.width = 0;
    const onIndexChange = vi.fn();
    render(<Lightbox images={IMAGES} isOpen onIndexChange={onIndexChange} />);
    swipeTo(500);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("clamps the index and stays still under Reduce Motion", () => {
    state.isReduced = true;
    render(<Lightbox images={IMAGES} isOpen index={9} />);
    expect(state.modal["animationType"]).toBe("none");
    expect(screen.getByText("3 of 3")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Next image" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(state.scrolled).toEqual([{ x: 400, animated: false }]);
  });

  it("opens from its default and closes itself on the back button", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Lightbox images={IMAGES} defaultOpen defaultIndex={1} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByText("2 of 3")).toBeTruthy();
    act(() => (state.modal["onRequestClose"] as () => void)());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(container.innerHTML).toBe("");
  });
});
