/**
 * Stackra file contract:
 * Purpose: proves the web TrackerStrip's pointer and focus readout: hovering a cell shows its readout, describes the
 *          image by it and dims the other cells; leaving the strip or moving focus away clears it; Home goes to the
 *          first cell; the readout keeps to the strip's start near the start, centres over a middle
 *          cell and keeps to its end near the end; other keys
 *          and an empty strip show nothing.
 * Boundary: jsdom; the readout's place is read from its logical inline insets, not drawn.
 * Runtime: browser
 * Governing contract: WCAG 2.2 SC 1.4.13 and 2.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { TrackerCell } from "#contracts/types/tracker-cell.type";
import { TrackerStrip } from "#react/tracker-strip/tracker-strip";

const CELLS: readonly TrackerCell[] = Array.from({ length: 10 }, (_, index) => ({
  key: `d${index + 1}`,
  label: `${index + 1} Oct`,
  status: index === 4 ? "down" : "up",
}));

/** The readout's inline style text: jsdom's style object drops logical insets. */
const inset = () => screen.getByRole("status").getAttribute("style");

/** The cells drawn inside the image. */
const cellsOf = (strip: HTMLElement) => [...strip.querySelectorAll<HTMLElement>("span")];

describe("TrackerStrip pointer (web)", () => {
  it("shows a hovered cell's readout, describes the image by it and dims the others", () => {
    render(<TrackerStrip cells={CELLS} label="API" />);
    const strip = screen.getByRole("img");
    const fifth = cellsOf(strip)[4];
    if (!fifth) throw new Error("no cell");
    fireEvent.mouseEnter(fifth);
    const readout = screen.getByRole("status");
    expect(readout.textContent).toBe("5 OctDown");
    expect(strip.getAttribute("aria-describedby")).toBeTruthy();
    const dimmed = cellsOf(strip).filter((cell) =>
      cell.className.includes("opacity-(--opacity-dimmed)"),
    );
    expect(dimmed).toHaveLength(CELLS.length - 1);
    expect(fifth.className).not.toContain("opacity-(--opacity-dimmed)");
  });

  it("clears the readout when the pointer leaves or focus moves away", () => {
    render(<TrackerStrip cells={CELLS} label="API" />);
    const strip = screen.getByRole("img");
    fireEvent.keyDown(strip, { key: "Home" });
    expect(screen.getByRole("status").textContent).toBe("1 OctOperational");
    fireEvent.mouseLeave(strip);
    expect(screen.getByRole("status").textContent).toBe("");
    expect(strip.hasAttribute("aria-describedby")).toBe(false);
    fireEvent.keyDown(strip, { key: "ArrowRight" });
    expect(screen.getByRole("status").textContent).toBe("1 OctOperational");
    fireEvent.blur(strip);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("keeps the readout to the strip's start and end near the edges", () => {
    render(<TrackerStrip cells={CELLS} label="API" />);
    const strip = screen.getByRole("img");
    fireEvent.keyDown(strip, { key: "Home" });
    expect(inset()).toBe("inset-inline-start: 0%;");
    fireEvent.keyDown(strip, { key: "ArrowRight" });
    fireEvent.keyDown(strip, { key: "ArrowRight" });
    expect(inset()).toBe("inset-inline-start: 25%;");
    expect(screen.getByRole("status").className).toContain("-translate-x-1/2");
    fireEvent.keyDown(strip, { key: "End" });
    expect(inset()).toBe("inset-inline-end: 0%;");
  });

  it("ignores other keys and shows nothing for an empty strip", () => {
    const { unmount } = render(<TrackerStrip cells={CELLS} label="API" />);
    fireEvent.keyDown(screen.getByRole("img"), { key: "a" });
    expect(screen.getByRole("status").textContent).toBe("");
    unmount();
    render(<TrackerStrip cells={[]} label="API" />);
    const strip = screen.getByRole("img");
    expect(strip.getAttribute("aria-label")).toBe("API");
    fireEvent.keyDown(strip, { key: "End" });
    expect(screen.getByRole("status").textContent).toBe("");
  });
});
