/**
 * Stackra file contract:
 * Purpose: proves the native Spinner draws the dot loader's 3×3 cell at the three sizes in the resolved tone colour
 *          (foreground for `default`, accent when left out), builds it 80 ms a dot, holds and clears it on a 1280 ms
 *          loop, rests full and dimmed under reduced motion, lays its rows out in the provider's direction, is one
 *          named, busy progressbar with a label and hidden without one, and passes the view's own props through.
 * Boundary: React Native does not render in vitest, so `View` is a recording stand-in that renders plain DOM (a dot
 *           carries its style as data), and the theme colour, the provider and the motion level are stand-ins; what
 *           the views are handed is checked, not their rendering on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement);
 *          .agents/specs/sta-2017-dot-loader/spec.md.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-043 sta-350:P-032 sta-350:P-034
import { act, render } from "@testing-library/react";

import { Size } from "#contracts/enums/size.enum";
import { TextTone } from "#contracts/enums/text-tone.enum";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";
import { Spinner } from "#native/spinner/spinner";
import type { SpinnerProps } from "#native/spinner/spinner.props";

/** What the stand-ins were handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  motion: "full",
  direction: "ltr",
  views: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      const style = props["style"] as Record<string, unknown> | undefined;
      // A dot is the only view with a plain style that carries a colour.
      const isDot = style !== undefined && !Array.isArray(style) && "backgroundColor" in style;
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

interface DotStyle {
  width: number;
  height: number;
  backgroundColor: string;
  opacity: number;
}

const dotsOf = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-dot]")].map(
    (node) => JSON.parse(node.dataset["dot"] ?? "{}") as DotStyle,
  );
const litOf = (container: HTMLElement) =>
  dotsOf(container).filter((dot) => dot.opacity === 1).length;
/** The last props handed to the view that matches. */
const lastView = (matches: (props: Record<string, unknown>) => boolean) =>
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  state.views.filter(matches).at(-1) ?? {};
/** The root is the one view whose style is a list: the reduced-motion dimming, then the caller's. */
const rootProps = () => lastView((props) => Array.isArray(props["style"]));
const gridStyle = () =>
  lastView((props) => "direction" in ((props["style"] ?? {}) as object))["style"] as Record<
    string,
    unknown
  >;

const onLayout = () => undefined;

describe("Spinner (native)", () => {
  beforeEach(() => {
    state.motion = "full";
    state.direction = "ltr";
    state.views = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a medium accent cell of nine dots with no props", () => {
    const { container } = render(<Spinner />);
    expect(dotsOf(container)).toHaveLength(9);
    for (const dot of dotsOf(container))
      expect(dot).toMatchObject({ width: 6, height: 6, backgroundColor: "color:accent" });
  });

  // @covers sta-2017:FR-002
  it.each(Size)("draws size %s at the contract's diameter", (size) => {
    const { container } = render(<Spinner size={size} />);
    const { dot, gap } = { sm: { dot: 4, gap: 2 }, md: { dot: 6, gap: 3 }, lg: { dot: 8, gap: 4 } }[
      size
    ];
    expect(3 * dot + 2 * gap).toBe({ sm: 16, md: 24, lg: 32 }[size]);
    expect(gridStyle()).toMatchObject({ gap });
    for (const node of dotsOf(container)) expect(node).toMatchObject({ width: dot, height: dot });
  });

  // @covers sta-2017:FR-002
  it.each(TextTone)("resolves tone %s to its theme colour", (tone) => {
    const { container } = render(<Spinner tone={tone} />);
    for (const dot of dotsOf(container))
      expect(dot.backgroundColor).toBe(`color:${tone === "default" ? "foreground" : tone}`);
    expect(rootProps()).not.toHaveProperty("tone");
  });

  // @covers sta-2017:FR-002
  it("builds the floors a dot every 80 ms, holds, then clears on a 1280 ms loop", () => {
    vi.useFakeTimers();
    const { container } = render(<Spinner />);
    // The bottom row's inline-start dot comes first: the seventh in document order.
    expect(litOf(container)).toBe(1);
    expect(dotsOf(container)[6]?.opacity).toBe(1);
    // The first step runs on a 0 ms timer and keeps the first dot.
    act(() => vi.advanceTimersByTime(0));
    expect(litOf(container)).toBe(1);
    act(() => vi.advanceTimersByTime(80));
    expect(litOf(container)).toBe(2);
    expect(dotsOf(container)[7]?.opacity).toBe(1);
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
    state.motion = level;
    const { container } = render(<Spinner />);
    expect(litOf(container)).toBe(9);
    expect(rootProps()["style"]).toEqual([{ opacity: 0.6 }, undefined]);
    act(() => vi.advanceTimersByTime(1280));
    expect(litOf(container)).toBe(9);
  });

  // @covers sta-2017:FR-006
  it("lays its rows out in the provider's direction, so they fill from the right in right-to-left", () => {
    state.direction = "rtl";
    render(<Spinner />);
    expect(gridStyle()).toMatchObject({ direction: "rtl" });
  });

  it("is one named, busy progressbar by its label, its dots hidden", () => {
    render(<Spinner label="Loading orders" />);
    expect(rootProps()).toMatchObject({
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: "Loading orders",
      accessibilityState: { busy: true },
    });
    for (const key of ["accessibilityElementsHidden", "importantForAccessibility"])
      expect(rootProps()).not.toHaveProperty(key);
    expect(lastView((props) => "direction" in ((props["style"] ?? {}) as object))).toMatchObject({
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  it("is hidden from VoiceOver and TalkBack without a label, or with an empty one", () => {
    for (const props of [{}, { label: "" }]) {
      render(<Spinner {...props} />);
      expect(rootProps()).toMatchObject({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      });
      expect(rootProps()).not.toHaveProperty("accessibilityLabel");
    }
  });

  it("passes the view's own props through", () => {
    render(
      <Spinner
        className="m-2"
        style={{ opacity: 0.5 }}
        testID="s"
        onLayout={onLayout}
        accessibilityHint="hint"
      />,
    );
    expect(rootProps()).toMatchObject({
      className: "m-2",
      style: [null, { opacity: 0.5 }],
      testID: "s",
      onLayout,
      accessibilityHint: "hint",
    });
  });

  it("types: extends the contract and refuses `color`, `children`, `isLoading` and the name props", () => {
    expectTypeOf<SpinnerProps>().toExtend<SpinnerContractProps>();
    // @ts-expect-error the colour role is `tone`
    render(<Spinner color="danger" />);
    // @ts-expect-error there is no custom indicator
    render(<Spinner>x</Spinner>);
    // @ts-expect-error a spinner is the loading state: render it or not
    render(<Spinner isLoading={false} />);
    // @ts-expect-error the accessible name is `label`
    render(<Spinner accessibilityLabel="x" />);
    // @ts-expect-error the spinner sets `busy`
    render(<Spinner accessibilityState={{ busy: false }} />);
  });
});
