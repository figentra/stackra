/**
 * Stackra file contract:
 * Purpose: proves the web MarkerMap: the map is one image named by its label, with a pin per marker placed by
 *          projection; the pins are listed in a panel named by `listLabel` (or the label), each row named by its label
 *          and count; choosing a row or a pin selects it in both and reports its id; a controlled `selectedId` is
 *          followed; the projection fits and centres the pins; and in right-to-left the map is not mirrored.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 *           `useBreakpoint` is replaced with a desktop width, so the panel is in the page.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0060 (right-to-left); STA-1981.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MarkerMap } from "#react/marker-map/marker-map";
import { markerPointsOf } from "#react/marker-map/marker-points-of.function";

vi.mock("#react/use-breakpoint/use-breakpoint", () => ({
  useBreakpoint: () => ({ breakpoint: "xl", sizeClass: "desktop" }),
}));

const MARKERS = [
  { id: "ruh", label: "Riyadh", latitude: 24.71, longitude: 46.68, count: 12 },
  { id: "jed", label: "Jeddah", latitude: 21.54, longitude: 39.17, count: 3 },
  { id: "dmm", label: "Dammam", latitude: 26.43, longitude: 50.1 },
] as const;

const pin = (container: HTMLElement, id: string) =>
  container.querySelector(`circle[data-id='${id}']`) as SVGCircleElement;

beforeEach(() => {
  window.localStorage.clear();
});

describe("MarkerMap (web)", () => {
  it("draws the map as one named image with a pin per marker, and lists them", () => {
    const { container } = render(
      <MarkerMap label="Job sites" listLabel="Sites" markers={MARKERS} />,
    );
    expect(screen.getByRole("img", { name: "Job sites" })).toBeTruthy();
    expect(container.querySelectorAll("circle")).toHaveLength(3);
    expect(screen.getByRole("complementary", { name: "Sites" })).toBeTruthy();
    expect(screen.getByRole("listbox", { name: "Sites" })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Riyadh.*12/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Dammam" })).toBeTruthy();
  });

  it("selects from the list and from the map, in both, and reports the id", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MarkerMap label="Job sites" markers={MARKERS} onSelect={onSelect} />,
    );
    act(() => screen.getByRole("option", { name: /Jeddah/ }).click());
    expect(onSelect).toHaveBeenLastCalledWith("jed");
    expect(pin(container, "jed").dataset.selected).toBe("true");
    fireEvent.click(pin(container, "ruh"));
    expect(onSelect).toHaveBeenLastCalledWith("ruh");
    expect(screen.getByRole("option", { name: /Riyadh/ }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("reaches the list's choice from the keyboard", () => {
    const onSelect = vi.fn();
    render(<MarkerMap label="Job sites" markers={MARKERS} onSelect={onSelect} />);
    const first = screen.getByRole("option", { name: /Riyadh/ });
    act(() => first.focus());
    fireEvent.keyDown(first, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter" });
    expect(onSelect).toHaveBeenCalled();
  });

  it("follows a controlled selection", () => {
    const { container, rerender } = render(
      <MarkerMap label="Job sites" markers={MARKERS} selectedId="dmm" />,
    );
    expect(pin(container, "dmm").dataset.selected).toBe("true");
    fireEvent.click(pin(container, "ruh"));
    expect(pin(container, "ruh").dataset.selected).toBeUndefined();
    rerender(<MarkerMap label="Job sites" markers={MARKERS} selectedId={null} />);
    expect(container.querySelector("circle[data-selected]")).toBeNull();
  });

  it("fits the pins in the box, east to the right and north up, and centres one pin", () => {
    const [ruh, jed, dmm] = markerPointsOf(MARKERS, { width: 1000, height: 600 });
    expect((dmm?.x ?? 0) > (ruh?.x ?? 0) && (ruh?.x ?? 0) > (jed?.x ?? 0)).toBe(true);
    expect((dmm?.y ?? 0) < (jed?.y ?? 0)).toBe(true);
    for (const point of [ruh, jed, dmm]) {
      expect(point?.x).toBeGreaterThanOrEqual(32);
      expect(point?.x).toBeLessThanOrEqual(968);
    }
    expect(markerPointsOf([MARKERS[0]], { width: 1000, height: 600 })).toEqual([
      { id: "ruh", x: 500, y: 300 },
    ]);
    expect(markerPointsOf([], { width: 1000, height: 600 })).toEqual([]);
  });

  it("does not mirror the map in right-to-left", () => {
    const { container: ltr } = render(<MarkerMap label="Job sites" markers={MARKERS} />);
    const east = pin(ltr, "dmm").getAttribute("cx");
    const { container: rtl } = render(
      <div dir="rtl">
        <MarkerMap label="مواقع العمل" markers={MARKERS} />
      </div>,
    );
    expect(screen.getByRole("img", { name: "مواقع العمل" })).toBeTruthy();
    expect(pin(rtl, "dmm").getAttribute("cx")).toBe(east);
  });
});
