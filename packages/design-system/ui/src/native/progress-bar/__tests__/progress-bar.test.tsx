/**
 * Stackra file contract:
 * Purpose: proves the native ProgressBar is one accessible progressbar (named, with its range, value and text, and
 *          busy only while indeterminate), draws its track as a row of dots (20, 16 or 10 by size) of the track's height
 *          in the tone's theme colour at the three sizes, fills them from the inline start to its value in whole steps,
 *          builds along the row while indeterminate in either direction, rests lit and dimmed under reduced motion,
 *          shows its label and value text only when asked, and passes the view's own props through.
 * Boundary: React Native and heroui-native do not run in vitest, so `View` is a recording stand-in that renders plain
 *          DOM (a dot carries its style as data), and the provider and the motion level are stand-ins; what the bar
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
import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import { PROGRESS_FILL_ROLE } from "#core/constants/progress-fill-role.constant";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import type { ProgressBarProps } from "#native/progress-bar/progress-bar.props";

/** What the stand-ins were handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  motion: "full",
  direction: "ltr",
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
  useDesignSystem: () => ({ locale: "en", direction: state.direction }),
}));

vi.mock("#native/design-system-provider/use-motion", () => ({ useMotion: () => state.motion }));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-testid": "text" }, props["children"] as never),
  };
});

interface DotStyle {
  width: number;
  height: number;
  backgroundColor: string;
  opacity: number;
}

/** The last props handed to the view that matches. */
const lastView = (matches: (props: Record<string, unknown>) => boolean) =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  state.views.filter(matches).at(-1) ?? {};
const rootProps = () => lastView((props) => props["accessibilityRole"] === "progressbar");
const gridStyle = () =>
  lastView((props) => "direction" in ((props["style"] ?? {}) as object))["style"] as Record<
    string,
    unknown
  >;
const dotsOf = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-dot]")].map(
    (node) => JSON.parse(node.dataset["dot"] ?? "{}") as DotStyle,
  );
const litOf = (container: HTMLElement) =>
  dotsOf(container).filter((dot) => dot.opacity === 1).length;
const textsOf = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-testid="text"]')].map((node) => node.textContent);

describe("ProgressBar (native)", () => {
  beforeEach(() => {
    state.motion = "full";
    state.direction = "ltr";
    state.views = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is one named, busy, indeterminate progressbar with only a label", () => {
    render(<ProgressBar label="Uploading" />);
    expect(rootProps()).toMatchObject({
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: "Uploading",
      accessibilityState: { busy: true },
    });
    expect(rootProps()).not.toHaveProperty("accessibilityValue");
  });

  // @covers sta-2017:FR-003
  it("is determinate with a value: the range, the value and its text, not busy, and dots filled to it", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    expect(rootProps()).toMatchObject({
      accessibilityState: { busy: false },
      accessibilityValue: { min: 0, max: 100, now: 40, text: "40%" },
    });
    // 40 of 100 over a medium bar's 16 dots rounds 6.4 up to 7.
    expect(dotsOf(container)).toHaveLength(16);
    expect(litOf(container)).toBe(7);
    expect(dotsOf(container)[6]?.opacity).toBe(1);
    expect(dotsOf(container)[7]?.opacity).toBe(0.18);
  });

  it("holds a value to its range and speaks the caller's text", () => {
    const { container } = render(
      <ProgressBar label="Uploading" value={99} maxValue={12} valueLabel="12 of 12" />,
    );
    expect(rootProps()).toMatchObject({
      accessibilityValue: { min: 0, max: 12, now: 12, text: "12 of 12" },
    });
    expect(litOf(container)).toBe(16);
  });

  // @covers sta-2017:FR-003
  it.each(Size)("draws dots of size %s at the track's height", (size) => {
    const { container } = render(<ProgressBar label="Uploading" size={size} value={10} />);
    const side = { sm: 4, md: 8, lg: 12 }[size];
    // Fewer, larger dots as the size grows, as on web.
    expect(dotsOf(container)).toHaveLength({ sm: 20, md: 16, lg: 10 }[size]);
    for (const dot of dotsOf(container)) expect(dot).toMatchObject({ width: side, height: side });
  });

  it("is a medium accent bar by default", () => {
    const { container } = render(<ProgressBar label="Uploading" value={10} />);
    for (const dot of dotsOf(container))
      expect(dot).toMatchObject({ height: 8, backgroundColor: "color:accent" });
  });

  it.each(Enum.values(Tone))("fills tone %s in its role", (tone) => {
    const { container } = render(<ProgressBar label="Uploading" tone={tone} value={10} />);
    for (const dot of dotsOf(container))
      expect(dot.backgroundColor).toBe(`color:${PROGRESS_FILL_ROLE[tone]}`);
  });

  it("steps straight to a new value, with no tween", () => {
    const { container, rerender } = render(<ProgressBar label="Uploading" value={10} />);
    expect(litOf(container)).toBe(2);
    rerender(<ProgressBar label="Uploading" value={60} />);
    expect(litOf(container)).toBe(10);
  });

  // @covers sta-2017:FR-003
  it("builds along the row from the inline start a dot every 80 ms while indeterminate", () => {
    vi.useFakeTimers();
    const { container } = render(<ProgressBar label="Uploading" />);
    expect(litOf(container)).toBe(1);
    expect(dotsOf(container)[0]?.opacity).toBe(1);
    act(() => vi.advanceTimersByTime(80));
    expect(litOf(container)).toBe(2);
    act(() => vi.advanceTimersByTime(80 * 14));
    expect(litOf(container)).toBe(16);
    // The last dot lands at 1200 ms; the full row holds until 1680 ms, in a 1840 ms loop.
    act(() => vi.advanceTimersByTime(480));
    expect(litOf(container)).toBe(0);
  });

  // @covers sta-2017:FR-006
  it("lays the row out in the provider's direction, so it fills from the right in right-to-left", () => {
    state.direction = "rtl";
    render(<ProgressBar label="Uploading" />);
    expect(gridStyle()).toMatchObject({ direction: "rtl" });
  });

  // @covers sta-2017:FR-007
  it("rests lit and dimmed with no timer under reduced motion, and draws a value as it is", () => {
    vi.useFakeTimers();
    state.motion = "reduced";
    const { container, rerender } = render(<ProgressBar label="Uploading" />);
    expect(litOf(container)).toBe(16);
    expect(state.views.map((props) => props["style"])).toContainEqual({ opacity: 0.6 });
    act(() => vi.advanceTimersByTime(1840));
    expect(litOf(container)).toBe(16);
    state.views = [];
    rerender(<ProgressBar label="Uploading" value={40} />);
    expect(litOf(container)).toBe(7);
    expect(state.views.map((props) => props["style"])).not.toContainEqual({ opacity: 0.6 });
  });

  it("stops the build when it gets a value", () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<ProgressBar label="Uploading" />);
    rerender(<ProgressBar label="Uploading" value={50} />);
    expect(litOf(container)).toBe(8);
    act(() => vi.advanceTimersByTime(1840));
    expect(litOf(container)).toBe(8);
  });

  it("draws no text unless asked", () => {
    const { container } = render(<ProgressBar label="Uploading" value={40} />);
    expect(textsOf(container)).toEqual([]);
  });

  it("draws the label and the value text when asked", () => {
    const { container } = render(
      <ProgressBar label="Storage used" value={40} isLabelVisible isValueVisible />,
    );
    expect(textsOf(container)).toEqual(["Storage used", "40%"]);
  });

  it("draws the caller's value text, and none while indeterminate", () => {
    const { container, rerender } = render(
      <ProgressBar label="Uploading" value={3} valueLabel="3 of 12" isValueVisible />,
    );
    expect(textsOf(container)).toEqual(["3 of 12"]);
    rerender(<ProgressBar label="Uploading" isValueVisible />);
    expect(textsOf(container)).toEqual([]);
  });

  it("passes the view's own props through to the root", () => {
    render(<ProgressBar label="Uploading" testID="bar" style={{ opacity: 0.5 }} />);
    expect(rootProps()).toMatchObject({ testID: "bar", style: { opacity: 0.5 } });
  });

  it("types: extends the contract, needs a label and refuses `color`-like and accessibility props", () => {
    expectTypeOf<ProgressBarProps>().toExtend<ProgressBarContractProps>();
    // @ts-expect-error a progress bar must be named
    render(<ProgressBar />);
    // @ts-expect-error the name is `label`
    render(<ProgressBar label="x" accessibilityLabel="x" />);
    // @ts-expect-error the value is `value`, and the component sets the accessibility value
    render(<ProgressBar label="x" accessibilityValue={{ now: 1 }} />);
    // @ts-expect-error the parts are drawn by the component
    render(<ProgressBar label="x">child</ProgressBar>);
  });
});
