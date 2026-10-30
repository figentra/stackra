/**
 * Stackra file contract:
 * Purpose: proves the native Lightbox shows nothing closed, opens as a modal named by its label with "1 of 2", names
 *          each picture by its alt, steps with its buttons, and closes from its close button.
 * Boundary: React Native, Reanimated and the IconButton are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Lightbox } from "#native/lightbox/lightbox";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box =
    (tag: string) =>
    ({ children, accessibilityLabel }: Record<string, unknown>) =>
      createElement(tag, { "aria-label": accessibilityLabel }, children as never);
  return {
    View: box("div"),
    Text: box("span"),
    ScrollView: box("div"),
    Image: ({ accessibilityLabel }: Record<string, unknown>) =>
      createElement("img", { alt: accessibilityLabel }),
    Modal: ({ visible, children }: Record<string, unknown>) =>
      visible ? createElement("section", null, children as never) : null,
    useWindowDimensions: () => ({ width: 390, height: 800 }),
  };
});
vi.mock("react-native-reanimated", () => ({ useReducedMotion: () => true }));
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
  { id: "a", src: "/a.jpg", alt: "Latte", caption: "Morning latte" },
  { id: "b", src: "/b.jpg", alt: "Croissant" },
];

describe("Lightbox (native)", () => {
  it("renders nothing while closed", () => {
    const { container } = render(<Lightbox images={IMAGES} />);
    expect(container.innerHTML).toBe("");
  });

  it("steps through the pictures and closes", () => {
    const seen: number[] = [];
    const changes: boolean[] = [];
    render(
      <Lightbox
        images={IMAGES}
        isOpen
        label="Menu photos"
        onIndexChange={(at) => seen.push(at)}
        onOpenChange={(isOpen) => changes.push(isOpen)}
      />,
    );
    expect(screen.getByLabelText("Menu photos").textContent).toContain("1 of 2");
    expect(screen.getByRole("img", { name: "Croissant" })).toBeTruthy();
    expect(screen.getByText("Morning latte")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(seen).toEqual([1]);
    expect(screen.getByLabelText("Menu photos").textContent).toContain("2 of 2");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(changes).toEqual([false]);
  });
});
