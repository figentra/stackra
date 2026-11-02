/**
 * Stackra file contract:
 * Purpose: proves the native ProgressCircle is one accessible progressbar (named, with its range, value and text, and
 *          busy only while indeterminate), draws a 3×3 cell of dots in the tone's theme colour at the three sizes,
 *          fills it in floor order to its value in whole steps, builds it a dot every 80 ms while indeterminate, rests
 *          full and dimmed under reduced motion, draws no text, and passes the view's own props through.
 * Boundary: React Native and heroui-native do not run in vitest, so `View` is a recording stand-in that renders plain
 *          DOM (a dot carries its style as data), and the provider and the motion level are stand-ins; what the circle
 *          hands its views is checked, not its rendering on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 2.3.3 and 4.1.2; ADR 0022 (test placement);
 *          .agents/specs/sta-2017-dot-loader/spec.md.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-119
import { Enum, Tone } from "@stackra/contracts";
import { act, render } from "@testing-library/react";

import { Size } from "#contracts/enums/size.enum";
import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";
import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { ProgressCircle } from "#native/progress-circle/progress-circle";
import type { ProgressCircleProps } from "#native/progress-circle/progress-circle.props";

/** What the stand-ins were handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  motion: "full",
  views: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", () => ({
  useThemeColor: (names: string | string[]) =>
    Array.isArray(names) ? names.map((name) => `color:${name}`) : `color:${names}`,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      const style = props["style"] as Record<string, unknown> | null | undefined;
      // A dot is the only view with a plain style that carries a colour.
      const isDot = style != null && !Array.isArray(style) && "backgroundColor" in style;
      return createElement(
        "div",
        isDot ? { "data-dot": JSON.stringify(style) } : null,
        props["children"] as never,
      );
    },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));

vi.mock("#native/design-system-provider/use-motion", () => ({ useMotion: () => state.motion }));

interface DotStyle {
  width: number;
  height: number;
  backgroundColor: string;
  opacity: number;
}

const rootProps = () =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  state.views.filter((props) => props["accessibilityRole"] === "progressbar").at(-1) ?? {};
const gridStyle = () =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  (state.views.filter((props) => "direction" in ((props["style"] ?? {}) as object)).at(-1) ?? {})[
    "style"
  ] as Record<string, unknown>;
const dotsOf = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-dot]")].map(
    (node) => JSON.parse(node.dataset["dot"] ?? "{}") as DotStyle,
  );
const litOf = (container: HTMLElement) =>
  dotsOf(container).filter((dot) => dot.opacity === 1).length;

describe("ProgressCircle (native)", () => {
  beforeEach(() => {
    state.motion = "full";
    state.views = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is one named, busy, indeterminate progressbar with only a label", () => {
    render(<ProgressCircle label="Syncing" />);
    expect(rootProps()).toMatchObject({
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: "Syncing",
      accessibilityState: { busy: true },
    });
    expect(rootProps()).not.toHaveProperty("accessibilityValue");
  });

  it("is determinate with a value: the range, the value and its text, and not busy", () => {
    render(<ProgressCircle label="Syncing" value={25} />);
    expect(rootProps()).toMatchObject({
      accessibilityState: { busy: false },
      accessibilityValue: { min: 0, max: 100, now: 25, text: "25%" },
    });
  });

  it("holds a value to its range and speaks the caller's text", () => {
    const { container } = render(
      <ProgressCircle label="Syncing" value={99} maxValue={12} valueLabel="12 of 12" />,
    );
    expect(rootProps()).toMatchObject({
      accessibilityValue: { min: 0, max: 12, now: 12, text: "12 of 12" },
    });
    expect(litOf(container)).toBe(9);
  });

  // @covers sta-2017:FR-004
  it.each(Size)("draws size %s as a 3×3 cell at the contract's diameter", (size) => {
    const { container } = render(<ProgressCircle label="Syncing" size={size} value={50} />);
    const { dot, gap } = { sm: { dot: 4, gap: 4 }, md: { dot: 6, gap: 5 }, lg: { dot: 8, gap: 6 } }[
      size
    ];
    // Three dots and two gaps span the contract's diameters.
    expect(3 * dot + 2 * gap).toBe({ sm: 20, md: 28, lg: 36 }[size]);
    expect(dotsOf(container)).toHaveLength(9);
    expect(gridStyle()).toMatchObject({ gap });
    for (const node of dotsOf(container)) expect(node).toMatchObject({ width: dot, height: dot });
  });

  it("is a medium accent cell by default", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={50} />);
    for (const dot of dotsOf(container))
      expect(dot).toMatchObject({ width: 6, backgroundColor: "color:accent" });
  });

  it.each(Enum.values(Tone))("fills tone %s in its role", (tone) => {
    const { container } = render(<ProgressCircle label="Syncing" tone={tone} value={50} />);
    for (const dot of dotsOf(container))
      expect(dot.backgroundColor).toBe(`color:${PROGRESS_FILL_ROLE[tone]}`);
  });

  // @covers sta-2017:FR-004
  it("fills five of nine dots in floor order at 50, the bottom row first", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={50} />);
    expect(dotsOf(container).map((dot) => dot.opacity === 1)).toEqual([
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
  });

  it("steps straight to a new value, with no tween", () => {
    const { container, rerender } = render(<ProgressCircle label="Syncing" value={10} />);
    expect(litOf(container)).toBe(1);
    rerender(<ProgressCircle label="Syncing" value={80} />);
    expect(litOf(container)).toBe(8);
  });

  // @covers sta-2017:FR-004
  it("builds the cell a dot every 80 ms while indeterminate, holds, then clears", () => {
    vi.useFakeTimers();
    const { container } = render(<ProgressCircle label="Syncing" />);
    expect(litOf(container)).toBe(1);
    expect(dotsOf(container)[6]?.opacity).toBe(1);
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
    state.motion = "reduced";
    const { container } = render(<ProgressCircle label="Syncing" />);
    expect(litOf(container)).toBe(9);
    expect(rootProps()["style"]).toEqual([{ opacity: 0.6 }, undefined]);
    act(() => vi.advanceTimersByTime(1280));
    expect(litOf(container)).toBe(9);
  });

  it("stops the build when it gets a value", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<ProgressCircle label="Syncing" />);
    rerender(<ProgressCircle label="Syncing" value={50} />);
    expect(litOf(container)).toBe(5);
    act(() => vi.advanceTimersByTime(1280));
    expect(litOf(container)).toBe(5);
  });

  it("draws no text", () => {
    const { container } = render(<ProgressCircle label="Syncing" value={50} />);
    expect(container.textContent).toBe("");
  });

  it("passes the view's own props through to the root", () => {
    render(<ProgressCircle label="Syncing" testID="ring" style={{ opacity: 0.5 }} />);
    expect(rootProps()).toMatchObject({ testID: "ring" });
    expect(rootProps()["style"]).toEqual([null, { opacity: 0.5 }]);
  });

  it("types: extends the contract, needs a label and refuses the accessibility props", () => {
    expectTypeOf<ProgressCircleProps>().toExtend<ProgressCircleContractProps>();
    // @ts-expect-error a progress circle must be named
    render(<ProgressCircle />);
    // @ts-expect-error the name is `label`
    render(<ProgressCircle label="x" accessibilityLabel="x" />);
    // @ts-expect-error the value is `value`, and the component sets the accessibility value
    render(<ProgressCircle label="x" accessibilityValue={{ now: 1 }} />);
    // @ts-expect-error the parts are drawn by the component
    render(<ProgressCircle label="x">child</ProgressCircle>);
  });
});
