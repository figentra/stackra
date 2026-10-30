/**
 * Stackra file contract:
 * Purpose: proves the native Gallery draws an "Open <alt>" button per picture in either layout, deals a masonry into
 *          columns, and opens the pressed picture in the Lightbox at its position.
 * Boundary: React Native and the Lightbox are recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Gallery } from "#native/gallery/gallery";

const state = vi.hoisted(() => ({ lightbox: {} as Record<string, unknown> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: ({ children, className }: Record<string, unknown>) =>
      createElement("div", { "data-class": className }, children as never),
    Image: () => null,
    Pressable: ({ children, onPress, accessibilityLabel }: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: onPress, "aria-label": accessibilityLabel },
        children as never,
      ),
  };
});
vi.mock("#native/lightbox/lightbox", () => ({
  Lightbox: (props: Record<string, unknown>) => {
    state.lightbox = props;
    return null;
  },
}));

const IMAGES = [
  { id: "a", src: "/a.jpg", alt: "Latte", width: 100, height: 300 },
  { id: "b", src: "/b.jpg", alt: "Croissant" },
  { id: "c", src: "/c.jpg", alt: "Beans" },
];

describe("Gallery (native)", () => {
  it("opens the pressed picture in the lightbox", () => {
    const pressed: string[] = [];
    render(<Gallery images={IMAGES} label="Menu" onImagePress={(id) => pressed.push(id)} />);
    expect(state.lightbox["isOpen"]).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Open Beans" }));
    expect(pressed).toEqual(["c"]);
    expect(state.lightbox["isOpen"]).toBe(true);
    expect(state.lightbox["index"]).toBe(2);
  });

  it("deals a masonry into columns", () => {
    const { container } = render(
      <Gallery images={IMAGES} label="Menu" layout="masonry" columns={2} />,
    );
    const columns = container.querySelectorAll("[data-class='flex-1 gap-2']");
    expect(columns).toHaveLength(2);
    expect(columns[1]?.querySelectorAll("button")).toHaveLength(2);
  });
});
