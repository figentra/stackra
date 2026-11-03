/**
 * Stackra file contract:
 * Purpose: proves the web Frame draws a window with its title and hidden dots, a phone and a plain frame on the frame
 *          radius, bleeds with logical margins (so right-to-left mirrors it), docks its tabs, and adds no focus stop or
 *          landmark of its own.
 * Boundary: jsdom with real HeroUI; classes and attributes are checked, not computed styles.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-2041.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Frame } from "#react/frame/frame";

describe("Frame (web)", () => {
  it("draws a window with its title and hidden dots on the frame radius", () => {
    const { container } = render(
      <Frame title="localhost:4000">
        <p>Body</p>
      </Frame>,
    );
    const frame = container.querySelector('[data-slot="frame"]');
    expect(frame?.className).toContain("rounded-[calc(var(--radius-lg)+4px)]");
    expect(screen.getByText("localhost:4000")).toBeTruthy();
    expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(3);
    expect(screen.getByText("Body")).toBeTruthy();
    expect(container.querySelectorAll("[tabindex], [role]")).toHaveLength(0);
  });

  it("draws a phone and a plain frame without a title bar", () => {
    const { container } = render(
      <>
        <Frame variant="phone" title="ignored">
          <span>Phone</span>
        </Frame>
        <Frame variant="plain">
          <span>Plain</span>
        </Frame>
      </>,
    );
    expect(container.querySelectorAll('[data-slot="frame-bar"]')).toHaveLength(0);
    expect(screen.queryByText("ignored")).toBeNull();
    expect(container.querySelector('[data-variant="phone"]')?.className).toContain(
      "aspect-[9/19.5]",
    );
  });

  it("bleeds with logical margins in right-to-left and docks its tabs", () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <Frame bleed="bottom-end" tabs={<button type="button">الويب</button>}>
          <span>صورة</span>
        </Frame>
      </I18nProvider>,
    );
    const frame = container.querySelector('[data-slot="frame"]');
    expect(frame?.className).toContain("-me-12");
    expect(frame?.className).toContain("-mb-12");
    expect(container.querySelector('[data-slot="frame-tabs"]')?.textContent).toBe("الويب");
  });
});
