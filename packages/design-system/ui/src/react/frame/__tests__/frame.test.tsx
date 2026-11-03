/**
 * Stackra file contract:
 * Purpose: proves the web Frame draws a window with its title and hidden dots, a phone and a plain frame on the frame
 *          radius, a schematic window with hidden stripes either side of its mono title on the blueprint radius, bleeds with logical margins (so right-to-left mirrors it), docks its tabs, and adds no focus stop or
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
    expect(frame?.className).toContain("rounded-[calc(var(--radius-lg)+var(--spacing))]");
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

  it("draws a schematic window: hidden stripes either side of its mono title, on the blueprint radius", () => {
    const { container } = render(
      <Frame variant="schematic" title="cancel-order.action.ts">
        <code>export class CancelOrderAction</code>
      </Frame>,
    );
    const frame = container.querySelector('[data-slot="frame"]');
    expect(frame?.getAttribute("data-variant")).toBe("schematic");
    expect(frame?.className).toContain("rounded-[var(--blueprint-frame-radius)]");
    expect(frame?.className).not.toContain("rounded-[calc(var(--radius-lg)+var(--spacing))]");
    const bar = container.querySelector('[data-slot="frame-bar"]');
    expect(bar?.className).toContain("h-7.5");
    const stripes = bar?.querySelectorAll('[aria-hidden="true"]') ?? [];
    expect(stripes).toHaveLength(2);
    for (const stripe of stripes)
      expect(stripe.className).toContain("var(--blueprint-rule-width)_solid_var(--blueprint-rule)");
    expect(bar?.children[1]?.textContent).toBe("cancel-order.action.ts");
    expect(bar?.children[1]?.className).toContain("font-mono");
    expect(container.querySelectorAll("[tabindex], [role]")).toHaveLength(0);
  });

  it("draws one stripe across a schematic bar without a title, mirrored in right-to-left", () => {
    const { container } = render(
      <I18nProvider locale="ar">
        <Frame variant="schematic" bleed="end">
          <span>مخطط</span>
        </Frame>
      </I18nProvider>,
    );
    const bar = container.querySelector('[data-slot="frame-bar"]');
    expect(bar?.children).toHaveLength(1);
    expect(container.querySelector('[data-slot="frame"]')?.className).toContain("-me-12");
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
