/**
 * Stackra file contract:
 * Purpose: proves the web StatusIndicator draws a different shape for every tone in the tone's colour, hides the shape
 *          from assistive technology so the text names the state, marks an attention state, takes an icon in place of
 *          the shape, sizes the shape and passes the span's props through.
 * Boundary: jsdom with real motion; no matchMedia, so motion is not reduced; the pulse itself is not measured.
 * Runtime: browser
 * Governing contract: gap inventory row 30 (owner approval 2026-10-28); ADR 0022 (test placement); WCAG 2.2 SC 1.4.1.
 */
// @vitest-environment jsdom
import { Enum, Tone } from "@stackra/contracts";
import { render, screen } from "@testing-library/react";

import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { StatusIndicator } from "#react/status-indicator/status-indicator";

const shapeOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="status-indicator-shape"]');

describe("StatusIndicator (web)", () => {
  it("draws a distinct shape per tone, in the tone's colour, hidden from screen readers", () => {
    const shapes = new Set<string>();
    for (const tone of Enum.values(Tone)) {
      const { container, unmount } = render(<StatusIndicator tone={tone}>Late</StatusIndicator>);
      const shape = shapeOf(container);
      expect(shape?.getAttribute("aria-hidden")).toBe("true");
      expect(shape?.style.color).toBe(`var(--${STATUS_DOT_ROLE[tone]})`);
      shapes.add(shape?.querySelector("svg")?.getAttribute("class") ?? "");
      expect(screen.getByText("Late")).toBeTruthy();
      unmount();
    }
    expect(shapes.size).toBe(Enum.values(Tone).length);
  });

  it("marks attention, takes an icon, sizes the shape and passes props through", () => {
    const { container, rerender } = render(
      <StatusIndicator tone="danger" isAttention size="lg" id="s" data-testid="ind">
        Late
      </StatusIndicator>,
    );
    const root = screen.getByTestId("ind");
    expect(root.id).toBe("s");
    expect(root.hasAttribute("data-attention")).toBe(true);
    expect(shapeOf(container)?.querySelector("svg")?.getAttribute("width")).toBe("24");
    rerender(
      <StatusIndicator icon={<b data-testid="mine" />} data-testid="ind">
        Draft
      </StatusIndicator>,
    );
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(screen.getByTestId("ind").hasAttribute("data-attention")).toBe(false);
  });
});
