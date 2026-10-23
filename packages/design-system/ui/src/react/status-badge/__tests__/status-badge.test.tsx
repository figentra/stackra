/**
 * Stackra file contract:
 * Purpose: proves the web StatusBadge is a neutral chip whatever its tone, puts a 6 px dot in the tone's theme colour
 *          first, reads as its text alone with no live region, forwards `size`, the id and the ref, and refuses
 *          `variant`, `startIcon` and a missing child.
 * Boundary: jsdom with real HeroUI; the theme CSS is not loaded, so the dot's inline colour is read, not its look.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 4); WCAG 2.2 SC 1.4.1; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-033 sta-350:FR-034 sta-350:P-023 sta-350:P-024
import { render } from "@testing-library/react";
import { createRef } from "react";

import { Tone } from "#contracts/enums/tone.enum";
import { STATUS_DOT_ROLE } from "#core/constants/status-dot-role.constant";
import { StatusBadge } from "#react/status-badge/status-badge";

describe("StatusBadge (web)", () => {
  it.each(Tone)("is a neutral chip with a %s dot first, before the text", (tone) => {
    const { container } = render(<StatusBadge tone={tone}>Active</StatusBadge>);
    const chip = container.querySelector('[data-slot="chip"]');
    expect(chip?.classList.contains("chip--secondary")).toBe(true);
    expect(chip?.classList.contains("chip--default")).toBe(true);
    const dot = chip?.firstElementChild as HTMLElement;
    expect(dot.getAttribute("data-slot")).toBe("status-badge-dot");
    expect(dot.style.backgroundColor).toBe(`var(--${STATUS_DOT_ROLE[tone]})`);
    expect([dot.style.width, dot.style.height]).toEqual(["6px", "6px"]);
    expect(dot.nextElementSibling?.classList.contains("chip__label")).toBe(true);
  });

  it("draws a neutral dot without a tone", () => {
    const { container } = render(<StatusBadge>Draft</StatusBadge>);
    const dot = container.querySelector<HTMLElement>('[data-slot="status-badge-dot"]');
    expect(dot?.style.backgroundColor).toBe("var(--muted)");
  });

  it("reads as its text alone and is never a live region", () => {
    const { container } = render(<StatusBadge tone="success">Active</StatusBadge>);
    expect(container.textContent).toBe("Active");
    expect(container.querySelector('[role="status"], [aria-live]')).toBeNull();
    const dot = container.querySelector('[data-slot="status-badge-dot"]');
    expect(dot?.textContent).toBe("");
    expect(dot?.hasAttribute("aria-label")).toBe(false);
  });

  it("forwards the size, the id and the ref to the chip", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <StatusBadge ref={ref} id="s" size="lg">
        Active
      </StatusBadge>,
    );
    const chip = container.querySelector('[data-slot="chip"]');
    expect(chip?.classList.contains("chip--lg")).toBe(true);
    expect(chip?.id).toBe("s");
    expect(ref.current).toBe(chip);
  });

  it("types: refuses `variant`, `startIcon` and a missing child", () => {
    // @ts-expect-error the badge is always a neutral chip
    render(<StatusBadge variant="soft">Active</StatusBadge>);
    // @ts-expect-error the dot is the badge's own start icon
    render(<StatusBadge startIcon={<i />}>Active</StatusBadge>);
    // @ts-expect-error the dot alone means nothing, so the state's name is required
    render(<StatusBadge />);
  });
});
