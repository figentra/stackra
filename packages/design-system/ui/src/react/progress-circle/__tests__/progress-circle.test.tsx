/**
 * Stackra file contract:
 * Purpose: proves the web ProgressCircle keeps HeroUI's root at the three sizes and in every tone, is a named
 *          progressbar with a value (clamped to its range, in the percentage or the caller's text) or without one
 *          (indeterminate, no value attributes), draws a 3×3 cell of dots and no text, fills it in floor order to the
 *          value with the leading dot in the emphasis colour or builds it without one, rests full and dimmed under
 *          reduced motion, and passes every other prop and the ref through.
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
import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";
import { ProgressCircle } from "#react/progress-circle/progress-circle";
import type { ProgressCircleProps } from "#react/progress-circle/progress-circle.props";

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

describe("ProgressCircle (web)", () => {
  beforeEach(() => {
    motion.level = "full";
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a medium accent ring with only a label, and indeterminate", () => {
    render(<ProgressCircle label="Syncing" />);
    const ring = screen.getByRole("progressbar", { name: "Syncing" });
    expect(ring.classList.contains("progress-circle--md")).toBe(true);
    expect(ring.classList.contains("progress-circle--accent")).toBe(true);
    for (const name of ["aria-valuenow", "aria-valuetext"])
      expect(ring.hasAttribute(name), name).toBe(false);
  });

  // @covers sta-2017:FR-004
  it.each(Size)("draws size %s at the contract's diameter", (size) => {
    const { container } = render(<ProgressCircle label="Syncing" size={size} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-circle--${size}`)).toBe(
      true,
    );
    const { dot, gap } = { sm: { dot: 4, gap: 4 }, md: { dot: 6, gap: 5 }, lg: { dot: 8, gap: 6 } }[
      size
    ];
    // Three dots and two gaps span the contract's diameters.
    expect(3 * dot + 2 * gap).toBe({ sm: 20, md: 28, lg: 36 }[size]);
    expect(container.querySelector<HTMLElement>('[data-slot="dot-grid"]')?.style.gap).toBe(
      `${gap}px`,
    );
    for (const node of dotsOf(container)) expect(node.style.inlineSize).toBe(`${dot}px`);
  });

  // @covers sta-2017:FR-004
  it.each(Enum.values(Tone))("draws tone %s", (tone) => {
    const { container } = render(<ProgressCircle label="Syncing" tone={tone} value={50} />);
    expect(screen.getByRole("progressbar").classList.contains(`progress-circle--${tone}`)).toBe(
      true,
    );
    const color = `var(--${tone === "default" ? "foreground" : tone})`;
    expect(container.querySelector<HTMLElement>('[data-slot="dot-grid"]')?.style.color).toBe(color);
    // The fifth dot in floor order leads at 50: the middle row's centre, the fifth in document order.
    expect(dotsOf(container)[4]?.style.background).toBe(
      tone === "accent" ? "var(--core, var(--accent))" : color,
    );
  });

  // @covers sta-2017:FR-004
  it("draws a hidden 3×3 cell of dots and no text", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={25} />);
    expect(dotsOf(container)).toHaveLength(9);
    expect(container.querySelector('[data-slot="dot-grid"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(container.textContent).toBe("");
  });

  // @covers sta-2017:FR-004
  it("is determinate with a value: its number, its percentage text and dots filled to it", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={25} />);
    const ring = screen.getByRole("progressbar");
    expect(ring.getAttribute("aria-valuenow")).toBe("25");
    expect(ring.getAttribute("aria-valuetext")).toBe("25%");
    // 25 of 100 rounds up to three of nine: the bottom row, the third dot leading.
    expect(litOf(container)).toBe(3);
    expect(emphasisOf(container)).toBe(8);
  });

  // @covers sta-2017:FR-004
  it("fills five of nine dots in floor order at 50", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={50} />);
    expect(dotsOf(container).map((dot) => dot.hasAttribute("data-lit"))).toEqual([
      false,
      false,
      false,
      true,
      true,
      false,
      true,
      true,
      true,
    ]);
    expect(emphasisOf(container)).toBe(4);
  });

  // @covers sta-2017:FR-004
  it("builds the cell a dot every 80 ms without a value, the ninth dot in the core", () => {
    vi.useFakeTimers();
    const { container } = render(<ProgressCircle label="Syncing" />);
    expect(litOf(container)).toBe(1);
    expect(emphasisOf(container)).toBe(2);
    act(() => vi.advanceTimersByTime(80));
    expect(litOf(container)).toBe(2);
    act(() => vi.advanceTimersByTime(80 * 7));
    expect(litOf(container)).toBe(9);
    act(() => vi.advanceTimersByTime(480));
    expect(litOf(container)).toBe(0);
    act(() => vi.advanceTimersByTime(160));
    expect(litOf(container)).toBe(1);
  });

  // @covers sta-2017:FR-007
  it("rests full and dimmed with no timer under reduced motion", () => {
    vi.useFakeTimers();
    motion.level = "reduced";
    const { container } = render(<ProgressCircle label="Syncing" />);
    const cell = container.querySelector<HTMLElement>('[data-slot="progress-circle-dots"]');
    expect(litOf(container)).toBe(9);
    expect(cell?.style.opacity).toBe("0.6");
    act(() => vi.advanceTimersByTime(1280));
    expect(litOf(container)).toBe(9);
  });

  it("holds a value to the range and speaks the caller's text", () => {
    const { container } = render(
      <ProgressCircle label="Syncing" value={99} maxValue={12} valueLabel="12 of 12" />,
    );
    const ring = screen.getByRole("progressbar");
    expect(ring.getAttribute("aria-valuenow")).toBe("12");
    expect(ring.getAttribute("aria-valuetext")).toBe("12 of 12");
    expect(litOf(container)).toBe(9);
  });

  it("is named by aria-label", () => {
    render(<ProgressCircle label="Syncing" value={25} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("Syncing");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressCircle
        ref={ref}
        label="Syncing"
        id="c"
        data-testid="ring"
        aria-describedby="d"
        className="m-2"
      />,
    );
    const ring = screen.getByRole("progressbar");
    expect(ring.id).toBe("c");
    expect(ring.getAttribute("data-testid")).toBe("ring");
    expect(ring.getAttribute("aria-describedby")).toBe("d");
    expect(ring.classList.contains("m-2")).toBe(true);
    expect(ref.current).toBe(ring);
  });

  it("types: extends the contract, needs a label and refuses `color`, `isIndeterminate` and the name props", () => {
    expectTypeOf<ProgressCircleProps>().toExtend<ProgressCircleContractProps>();
    // @ts-expect-error a progress circle must be named
    render(<ProgressCircle />);
    // @ts-expect-error the colour role is `tone`
    render(<ProgressCircle label="x" color="danger" />);
    // @ts-expect-error a missing `value` is what makes it indeterminate
    render(<ProgressCircle label="x" isIndeterminate />);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<ProgressCircleProps>().not.toHaveProperty("aria-label");
  });
});
