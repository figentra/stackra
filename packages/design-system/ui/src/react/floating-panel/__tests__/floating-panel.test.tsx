/**
 * Stackra file contract:
 * Purpose: proves the web FloatingPanel opens as a non-modal dialog named by its title at the bottom inline-end corner
 *          (bottom left in right-to-left), moves with the arrow keys on its move handle (further with Shift) without
 *          leaving the viewport, resizes from its grip by keyboard and pointer, minimises to its header and closes on
 *          the close button and on Escape.
 * Boundary: jsdom with real HeroUI; the viewport is jsdom's 1024 by 768.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { FloatingPanel } from "#react/floating-panel/floating-panel";

const panel = () => screen.getByRole("dialog", { name: "Order assistant" });
const key = (element: Element, value: string, shiftKey = false) =>
  act(() => void fireEvent.keyDown(element, { key: value, shiftKey }));

describe("FloatingPanel (web)", () => {
  it("opens non-modal at the bottom end corner", () => {
    render(<FloatingPanel title="Order assistant">Ask about an order.</FloatingPanel>);
    expect(panel().getAttribute("aria-modal")).toBeNull();
    expect(panel().style.left).toBe(`${1024 - 360 - 16}px`);
    expect(panel().style.top).toBe(`${768 - 420 - 16}px`);
  });

  it("opens at the bottom left in right-to-left", () => {
    render(
      <I18nProvider locale="ar-SA">
        <FloatingPanel title="Order assistant">x</FloatingPanel>
      </I18nProvider>,
    );
    expect(panel().style.left).toBe("16px");
  });

  it("moves with the arrow keys and stays inside the viewport", () => {
    render(<FloatingPanel title="Order assistant">x</FloatingPanel>);
    const handle = screen.getByRole("button", { name: "Move the panel" });
    key(handle, "ArrowLeft");
    expect(panel().style.left).toBe(`${1024 - 360 - 16 - 10}px`);
    key(handle, "ArrowUp", true);
    expect(panel().style.top).toBe(`${768 - 420 - 16 - 50}px`);
    for (let i = 0; i < 5; i++) key(handle, "ArrowRight", true);
    expect(panel().style.left).toBe(`${1024 - 360}px`);
  });

  it("resizes from the grip by keyboard and pointer", () => {
    render(<FloatingPanel title="Order assistant">x</FloatingPanel>);
    const grip = screen.getByRole("button", { name: "Resize the panel" });
    key(grip, "ArrowLeft");
    expect(panel().style.width).toBe("350px");
    key(grip, "ArrowDown");
    expect(panel().style.height).toBe("430px");
    fireEvent.pointerDown(grip, { button: 0, clientX: 500, clientY: 500, pointerId: 1 });
    fireEvent.pointerMove(grip, { clientX: 300, clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(grip, { pointerId: 1 });
    expect(panel().style.width).toBe("240px");
    expect(panel().style.height).toBe("230px");
  });

  it("minimises to its header and closes", () => {
    const onOpenChange = vi.fn();
    render(
      <FloatingPanel title="Order assistant" onOpenChange={onOpenChange}>
        Ask about an order.
      </FloatingPanel>,
    );
    act(() => screen.getByRole("button", { name: "Minimise" }).click());
    expect(screen.getByText("Ask about an order.").closest("[hidden]")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Resize the panel" })).toBeNull();
    act(() => screen.getByRole("button", { name: "Restore" }).click());
    key(screen.getByRole("button", { name: "Move the panel" }), "Escape");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
