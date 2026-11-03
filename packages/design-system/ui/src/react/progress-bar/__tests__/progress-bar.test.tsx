/**
 * Stackra file contract:
 * Purpose: proves the web ProgressBar keeps HeroUI's bar root at the three sizes and in every tone, is a named
 *          progressbar with a value (clamped to its range, in the percentage or the caller's text) or without one
 *          (indeterminate, no value attributes), draws its track as a row of dots (20, 16 or 10 by size) filled from the
 *          inline start to the value with the leading dot in the emphasis colour, or builds along the row without one,
 *          rests lit and dimmed under reduced motion, names itself by `aria-label` or by its visible label, shows the
 *          value text only when asked and only while it has a value, and passes every other prop and the ref through.
 * Boundary: jsdom with real HeroUI and fake timers; the theme CSS is not loaded, so classes, attributes and inline
 *           styles are checked. The motion level is a stand-in a test turns.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-118
import { Enum, Tone } from "@stackra/contracts";
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import type { ProgressBarProps } from "#react/progress-bar/progress-bar.props";

/** The motion level the stand-in answers. */
const motion = vi.hoisted(() => ({ level: "full" }));

vi.mock("#react/design-system-provider/use-motion", () => ({ useMotion: () => motion.level }));

const dotsOf = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="dot"]'),
];
const litOf = (container: HTMLElement) =>
  dotsOf(container).filter((dot) => dot.hasAttribute("data-lit")).length;
/** The document-order index of the dot in the emphasis colour (the accent tone's core), or -1. */
const emphasisOf = (container: HTMLElement) =>
  dotsOf(container).findIndex((dot) => dot.style.background === "var(--core, var(--accent))");

describe("ProgressBar (web)", () => {
  beforeEach(() => {
    motion.level = "full";
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a medium accent bar with only a label, and indeterminate", () => {
    render(<ProgressBar label="Uploading" />);
    const bar = screen.getByRole("progressbar", { name: "Uploading" });
    expect(bar.classList.contains("progress-bar--md")).toBe(true);
    expect(bar.classList.contains("progress-bar--accent")).toBe(true);
    for (const name of ["aria-valuenow", "aria-valuetext"])
      expect(bar.hasAttribute(name), name).toBe(false);
  });

  // @covers sta-2017:FR-003
  it.each(Size)("draws size %s with dots of the track's height", (size) => {
    const { container } = render(<ProgressBar label="Uploading" size={size} value={40} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-bar--${size}`)).toBe(true);
    const side = `${{ sm: 4, md: 8, lg: 12 }[size]}px`;
    // Fewer, larger dots as the size grows, so each keeps a column of twice its side at the bar's 10rem minimum.
    expect(dotsOf(container)).toHaveLength({ sm: 20, md: 16, lg: 10 }[size]);
    for (const dot of dotsOf(container)) {
      expect(dot.style.inlineSize).toBe(side);
      expect(dot.style.blockSize).toBe(side);
    }
  });

  // @covers sta-2017:FR-003
  it.each(Enum.values(Tone))("draws tone %s", (tone) => {
    const { container } = render(<ProgressBar label="Uploading" tone={tone} value={40} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-bar--${tone}`)).toBe(true);
    const color = `var(--${tone === "default" ? "foreground" : tone})`;
    expect(container.querySelector<HTMLElement>('[data-slot="dot-grid"]')?.style.color).toBe(color);
    // Only the accent's leading dot takes the theme's core; every other tone keeps its own colour.
    expect(dotsOf(container)[6]?.style.background).toBe(
      tone === "accent" ? "var(--core, var(--accent))" : color,
    );
  });

  // @covers sta-2017:FR-003
  it("is determinate with a value: its number, its percentage text and dots filled to it", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("40%");
    // 40 of 100 over a medium bar's 16 dots rounds 6.4 up to 7.
    expect(dotsOf(container)).toHaveLength(16);
    expect(litOf(container)).toBe(7);
    expect(emphasisOf(container)).toBe(6);
    expect(container.querySelector('[data-slot="dot-grid"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("is determinate at zero, not indeterminate", () => {
    vi.useFakeTimers();
    const { container } = render(<ProgressBar label="Uploading" value={0} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
    expect(litOf(container)).toBe(0);
    expect(emphasisOf(container)).toBe(-1);
    act(() => vi.advanceTimersByTime(80));
    expect(litOf(container)).toBe(0);
  });

  it.each([
    [-5, "0", 0],
    [250, "100", 16],
  ])("holds %s to the range", (value, now, lit) => {
    const { container } = render(<ProgressBar label="Uploading" value={value} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(now);
    expect(litOf(container)).toBe(lit);
  });

  // @covers sta-2017:FR-003
  it("builds along the row a dot every 80 ms without a value, then clears", () => {
    vi.useFakeTimers();
    const { container } = render(<ProgressBar label="Uploading" />);
    expect(litOf(container)).toBe(1);
    expect(dotsOf(container)[0]?.hasAttribute("data-lit")).toBe(true);
    act(() => vi.advanceTimersByTime(80));
    expect(litOf(container)).toBe(2);
    expect(emphasisOf(container)).toBe(1);
    act(() => vi.advanceTimersByTime(80 * 14));
    expect(litOf(container)).toBe(16);
    // The last dot lands at 1200 ms; the full row holds until 1680 ms, in a 1840 ms loop.
    act(() => vi.advanceTimersByTime(479));
    expect(litOf(container)).toBe(16);
    act(() => vi.advanceTimersByTime(1));
    expect(litOf(container)).toBe(0);
  });

  // @covers sta-2017:FR-007
  it("rests lit and dimmed with no timer under reduced motion, and draws a value as it is", () => {
    vi.useFakeTimers();
    motion.level = "reduced";
    const { container, rerender } = render(<ProgressBar label="Uploading" />);
    const row = () => container.querySelector<HTMLElement>('[data-slot="progress-bar-dots"]');
    expect(litOf(container)).toBe(16);
    expect(row()?.style.opacity).toBe("0.6");
    act(() => vi.advanceTimersByTime(1840));
    expect(litOf(container)).toBe(16);
    rerender(<ProgressBar label="Uploading" value={40} />);
    expect(litOf(container)).toBe(7);
    expect(row()?.style.opacity).toBe("");
  });

  it("measures a custom range and speaks the caller's text", () => {
    const { container } = render(
      <ProgressBar
        label="Uploading"
        value={3}
        minValue={0}
        maxValue={12}
        valueLabel="3 of 12 files"
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemax")).toBe("12");
    expect(bar.getAttribute("aria-valuetext")).toBe("3 of 12 files");
    expect(litOf(container)).toBe(4);
  });

  it("names itself by aria-label and draws no text when the label is hidden", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("Uploading");
    expect(container.textContent).toBe("");
  });

  it("draws the label and names the bar by it when it is visible", () => {
    const { container } = render(<ProgressBar label="Storage used" value={40} isLabelVisible />);
    const bar = screen.getByRole("progressbar", { name: "Storage used" });
    expect(bar.hasAttribute("aria-label")).toBe(false);
    expect(container.querySelector('[data-slot="label"]')?.textContent).toBe("Storage used");
  });

  it("draws the value text only when asked, and not while indeterminate", () => {
    const { container, rerender } = render(
      <ProgressBar label="Uploading" value={40} isValueVisible />,
    );
    expect(container.querySelector(".progress-bar__output")?.textContent).toBe("40%");
    rerender(<ProgressBar label="Uploading" value={3} valueLabel="3 of 12" isValueVisible />);
    expect(container.querySelector(".progress-bar__output")?.textContent).toBe("3 of 12");
    rerender(<ProgressBar label="Uploading" isValueVisible />);
    expect(container.querySelector(".progress-bar__output")).toBeNull();
    rerender(<ProgressBar label="Uploading" value={40} />);
    expect(container.querySelector(".progress-bar__output")).toBeNull();
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressBar
        ref={ref}
        label="Uploading"
        id="b"
        data-testid="bar"
        aria-describedby="d"
        className="max-w-xs"
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.id).toBe("b");
    expect(bar.getAttribute("data-testid")).toBe("bar");
    expect(bar.getAttribute("aria-describedby")).toBe("d");
    expect(bar.classList.contains("max-w-xs")).toBe(true);
    expect(ref.current).toBe(bar);
  });

  it("types: extends the contract, needs a label and refuses `color`, `isIndeterminate` and the name props", () => {
    expectTypeOf<ProgressBarProps>().toExtend<ProgressBarContractProps>();
    // @ts-expect-error a progress bar must be named
    render(<ProgressBar />);
    // @ts-expect-error the colour role is `tone`
    render(<ProgressBar label="x" color="danger" />);
    // @ts-expect-error a missing `value` is what makes it indeterminate
    render(<ProgressBar label="x" isIndeterminate />);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<ProgressBarProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error the parts are drawn by the component
    render(<ProgressBar label="x">child</ProgressBar>);
  });

  // @covers sta-2017:FR-006
  it("fills from the inline start in right-to-left, with no physical side written inline", () => {
    const { container } = render(
      <div dir="rtl">
        <ProgressBar label="Uploading" value={40} />
      </div>,
    );
    // The grid's columns follow the reading direction, so document order is inline order on either side.
    expect(dotsOf(container).map((dot) => dot.hasAttribute("data-lit"))).toEqual([
      ...Array.from({ length: 7 }, () => true),
      ...Array.from({ length: 9 }, () => false),
    ]);
    for (const dot of dotsOf(container)) {
      expect(dot.style.left).toBe("");
      expect(dot.style.right).toBe("");
      expect(dot.style.transform).toBe("");
    }
  });
});
