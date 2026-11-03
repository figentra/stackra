/**
 * Stackra file contract:
 * Purpose: proves the web Spinner draws the dot loader's 3×3 cell at the three sizes and in every tone's colour (the
 *          accent's ninth dot in the theme's core), builds it 80 ms a dot, holds and clears it on a 1280 ms loop, rests
 *          full and dimmed under reduced motion, is one named status with a label and hidden without one, and passes
 *          every other prop and the ref through.
 * Boundary: jsdom with fake timers; the theme CSS is not loaded, so attributes and inline styles are checked. The
 *           motion level is a stand-in a test turns.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement);
 *          .agents/specs/sta-2017-dot-loader/spec.md.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-042 sta-350:P-032 sta-350:P-034
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";

import { Size } from "#contracts/enums/size.enum";
import { TextTone } from "#contracts/enums/text-tone.enum";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";
import { Spinner } from "#react/spinner/spinner";
import type { SpinnerProps } from "#react/spinner/spinner.props";

/** The motion level the stand-in answers. */
const motion = vi.hoisted(() => ({ level: "full" }));

vi.mock("#react/design-system-provider/use-motion", () => ({ useMotion: () => motion.level }));

const rootOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="spinner"]');
const dotsOf = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('[data-slot="dot"]'),
];
const litOf = (container: HTMLElement) =>
  dotsOf(container).filter((dot) => dot.hasAttribute("data-lit")).length;

describe("Spinner (web)", () => {
  beforeEach(() => {
    motion.level = "full";
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a medium accent spinner with no props", () => {
    const { container } = render(<Spinner />);
    expect(rootOf(container)?.getAttribute("data-size")).toBe("md");
    expect(rootOf(container)?.getAttribute("data-tone")).toBe("accent");
    expect(dotsOf(container)).toHaveLength(9);
  });

  // @covers sta-2017:FR-002
  it.each(Size)("draws size %s at the contract's diameter", (size) => {
    const { container } = render(<Spinner size={size} />);
    const { dot, gap } = { sm: { dot: 4, gap: 2 }, md: { dot: 6, gap: 3 }, lg: { dot: 8, gap: 4 } }[
      size
    ];
    expect(rootOf(container)?.getAttribute("data-size")).toBe(size);
    expect(3 * dot + 2 * gap).toBe({ sm: 16, md: 24, lg: 32 }[size]);
    expect(container.querySelector<HTMLElement>('[data-slot="dot-grid"]')?.style.gap).toBe(
      `${gap}px`,
    );
    for (const node of dotsOf(container)) {
      expect(node.style.inlineSize).toBe(`${dot}px`);
      expect(node.style.blockSize).toBe(`${dot}px`);
    }
  });

  // @covers sta-2017:FR-002
  it.each(TextTone)("draws tone %s in its colour", (tone) => {
    const { container } = render(<Spinner tone={tone} />);
    const root = rootOf(container);
    expect(root?.getAttribute("data-tone")).toBe(tone);
    expect(root?.style.color).toBe(`var(--${tone === "default" ? "foreground" : tone})`);
  });

  // @covers sta-2017:FR-002
  it("draws the ninth dot in the theme's core with the accent, and in the tone otherwise", () => {
    const { container, rerender } = render(<Spinner />);
    // The ninth dot in floor order is the top row's last: the third in document order.
    expect(dotsOf(container)[2]?.style.background).toBe("var(--core, var(--accent))");
    expect(
      dotsOf(container).filter((dot) => dot.style.background.startsWith("var(--core")),
    ).toHaveLength(1);
    rerender(<Spinner tone="danger" />);
    expect(dotsOf(container)[2]?.style.background).toBe("var(--danger)");
  });

  it("lets the caller's colour win over the role's", () => {
    const { container } = render(<Spinner tone="muted" style={{ color: "red" }} />);
    expect(rootOf(container)?.style.color).toBe("red");
  });

  // @covers sta-2017:FR-002 sta-2017:FR-006
  it("builds the floors a dot every 80 ms, holds, then clears on a 1280 ms loop", () => {
    vi.useFakeTimers();
    const { container } = render(<Spinner />);
    const dots = dotsOf(container);
    // The bottom row's inline-start dot comes first: the seventh in document order.
    expect(litOf(container)).toBe(1);
    expect(dots[6]?.hasAttribute("data-lit")).toBe(true);
    // The first step runs on a 0 ms timer and keeps the first dot.
    act(() => vi.advanceTimersByTime(0));
    expect(litOf(container)).toBe(1);
    act(() => vi.advanceTimersByTime(80));
    expect(litOf(container)).toBe(2);
    expect(dots[7]?.hasAttribute("data-lit")).toBe(true);
    act(() => vi.advanceTimersByTime(80 * 7));
    expect(litOf(container)).toBe(9);
    // The ninth dot lands at 640 ms; the full cell holds until 1120 ms.
    act(() => vi.advanceTimersByTime(479));
    expect(litOf(container)).toBe(9);
    act(() => vi.advanceTimersByTime(1));
    expect(litOf(container)).toBe(0);
    act(() => vi.advanceTimersByTime(160));
    expect(litOf(container)).toBe(1);
  });

  // @covers sta-2017:FR-007
  it.each(["reduced", "none"])("rests full and dimmed with no timer when motion is %s", (level) => {
    vi.useFakeTimers();
    motion.level = level;
    const { container } = render(<Spinner />);
    expect(litOf(container)).toBe(9);
    expect(rootOf(container)?.style.opacity).toBe("0.6");
    act(() => vi.advanceTimersByTime(1280));
    expect(litOf(container)).toBe(9);
  });

  it("is one status named by its label, never HeroUI's English one", () => {
    render(<Spinner label="جارٍ التحميل" />);
    const status = screen.getByRole("status", { name: "جارٍ التحميل" });
    expect(status.hasAttribute("aria-hidden")).toBe(false);
    expect(screen.queryByRole("status", { name: "Loading" })).toBeNull();
    expect(status.querySelector('[data-slot="dot-grid"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("is hidden without a label, or with an empty one", () => {
    const { container, rerender } = render(<Spinner />);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<Spinner label="" />);
    expect(rootOf(container)?.getAttribute("aria-hidden")).toBe("true");
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Spinner
        ref={ref}
        id="s"
        title="Wait"
        data-testid="spinner"
        aria-describedby="d"
        className="animate-[spin_1.5s_linear_infinite]"
      />,
    );
    const root = rootOf(container);
    expect(root?.id).toBe("s");
    expect(root?.getAttribute("title")).toBe("Wait");
    expect(root?.getAttribute("data-testid")).toBe("spinner");
    expect(root?.getAttribute("aria-describedby")).toBe("d");
    expect(root?.classList.contains("animate-[spin_1.5s_linear_infinite]")).toBe(true);
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract and refuses `color`, `aria-label` and `xl`", () => {
    expectTypeOf<SpinnerProps>().toExtend<SpinnerContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Spinner color="danger" />);
    // JSX does not check a hyphenated attribute against the props, so the type itself is asserted.
    expectTypeOf<SpinnerProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error a wait that big is a skeleton
    render(<Spinner size="xl" />);
  });
});
