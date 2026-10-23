/**
 * Stackra file contract:
 * Purpose: proves the native Spinner hands HeroUI Native the size, the resolved tone colour (foreground for
 *          `default`, accent when left out) and the accessibility props the contract promises, is hidden without a
 *          label, and passes the rest through.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering or reduced motion on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-041 sta-350:FR-043 sta-350:P-032 sta-350:P-034
import { render } from "@testing-library/react";

import { Size } from "#contracts/enums/size.enum";
import { TextTone } from "#contracts/enums/text-tone.enum";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";
import { Spinner, type SpinnerProps } from "#native/spinner/spinner";

/** The props the stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    Spinner: (props: Record<string, unknown>) => {
      received.props = props;
      return createElement("div", { "data-testid": "spinner" });
    },
    useThemeColor: (name: string) => `color:${name}`,
  };
});

describe("Spinner (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("is accent with no tone, and leaves the size to HeroUI", () => {
    render(<Spinner />);
    expect(received.props).toMatchObject({ color: "color:accent" });
    expect(received.props).not.toHaveProperty("size");
  });

  it.each(Size)("hands size %s over unchanged", (size) => {
    render(<Spinner size={size} />);
    expect(received.props).toMatchObject({ size });
  });

  it.each(TextTone)("resolves tone %s to its theme colour", (tone) => {
    render(<Spinner tone={tone} />);
    expect(received.props).toMatchObject({
      color: `color:${tone === "default" ? "foreground" : tone}`,
    });
    expect(received.props).not.toHaveProperty("tone");
  });

  it("is named by its label and leaves HeroUI's role and busy state alone", () => {
    render(<Spinner label="Loading orders" />);
    expect(received.props).toMatchObject({ accessibilityLabel: "Loading orders" });
    for (const key of ["accessible", "accessibilityElementsHidden", "importantForAccessibility"])
      expect(received.props).not.toHaveProperty(key);
  });

  it("is hidden from VoiceOver and TalkBack without a label, or with an empty one", () => {
    for (const props of [{}, { label: "" }]) {
      render(<Spinner {...props} />);
      expect(received.props).toMatchObject({
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      });
      expect(received.props).not.toHaveProperty("accessibilityLabel");
    }
  });

  it("passes the spinner's own props through", () => {
    const onLayout = () => undefined;
    render(
      <Spinner
        className="m-2"
        style={{ opacity: 0.5 }}
        testID="s"
        animation="disable-all"
        onLayout={onLayout}
        accessibilityHint="hint"
      />,
    );
    expect(received.props).toMatchObject({
      className: "m-2",
      style: { opacity: 0.5 },
      testID: "s",
      animation: "disable-all",
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
    // @ts-expect-error HeroUI sets `busy`
    render(<Spinner accessibilityState={{ busy: false }} />);
  });
});
