/**
 * Stackra file contract:
 * Purpose: proves the native `TrackerStrip`: one `image` named by its label whose value speaks the uptime and every
 *          period that was not up, and pressing a cell shows its readout, pressing it again hides it.
 * Boundary: React Native and Uniwind do not run in vitest, so they are recording stand-ins rendering plain DOM.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1 and 1.4.1; STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { TrackerCell } from "#contracts/types/tracker-cell.type";
import { TrackerStrip } from "#native/tracker-strip/tracker-strip";

const state = vi.hoisted(() => ({
  images: [] as Record<string, unknown>[],
  presses: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "image") state.images.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.presses.push(props);
      return createElement("button", { type: "button" }, props["children"] as ReactNode);
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

/** Three days: up, down with a note, no data. */
const CELLS: readonly TrackerCell[] = [
  { key: "d1", label: "1 Oct", status: "up" },
  { key: "d2", label: "2 Oct", status: "down", note: "Checkout errors" },
  { key: "d3", label: "3 Oct", status: "none" },
];

beforeEach(() => {
  state.images.length = 0;
  state.presses.length = 0;
});

describe("TrackerStrip (native)", () => {
  it("speaks the uptime and every period that was not up", () => {
    render(<TrackerStrip cells={CELLS} label="API" />);
    const image = state.images.at(-1);
    expect(image?.["accessibilityLabel"]).toBe("API");
    expect((image?.["accessibilityValue"] as { text: string } | undefined)?.text).toBe(
      "50% uptime; 2 Oct: Down. Checkout errors; 3 Oct: No data",
    );
  });

  it("shows a pressed cell's readout and hides it on a second press", () => {
    const { container } = render(<TrackerStrip cells={CELLS} label="API" />);
    act(() => (state.presses[1]?.["onPress"] as (() => void) | undefined)?.());
    expect(container.textContent).toContain("2 Oct: Down. Checkout errors");
    act(() => (state.presses.at(-2)?.["onPress"] as (() => void) | undefined)?.());
    expect(container.textContent).not.toContain("Checkout errors");
  });
});
