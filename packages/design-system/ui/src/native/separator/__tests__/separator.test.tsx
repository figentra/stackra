/**
 * Stackra file contract:
 * Purpose: proves the native Separator paints each colour level with its theme colour through an inline style that
 *          comes before the caller's, never hands HeroUI Native the contract's `variant` (which there means
 *          thickness), and passes the orientation, thickness, class and test id through.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by a recording stand-in that renders
 *          plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-029 sta-350:FR-031 sta-350:P-019 sta-350:P-022
import { render } from "@testing-library/react";
import type { SeparatorOrientation } from "heroui-native";

import type { Orientation } from "#contracts/enums/orientation.enum";
import { SeparatorVariant } from "#contracts/enums/separator-variant.enum";
import type { SeparatorContractProps } from "#contracts/types/separator-contract-props.type";
import { Separator } from "#native/separator/separator";
import type { SeparatorProps } from "#native/separator/separator.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    Separator: (props: Record<string, unknown>) => {
      received.props["separator"] = props;
      return createElement("div", { "data-testid": "separator" });
    },
    useThemeColor: (name: string) => `color:${name}`,
  };
});

const separatorProps = () => received.props["separator"] ?? {};

/** The theme colour each level is expected to paint. */
const EXPECTED_COLOR = {
  default: "separator",
  secondary: "separator-secondary",
  tertiary: "separator-tertiary",
} as const satisfies Record<SeparatorVariant, string>;

describe("Separator (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(SeparatorVariant)("paints the %s level with its theme colour", (variant) => {
    render(<Separator variant={variant} />);
    const style = separatorProps()["style"] as unknown[];
    expect(style[0]).toEqual({ backgroundColor: `color:${EXPECTED_COLOR[variant]}` });
  });

  it("paints the default level and leaves HeroUI Native's thickness variant alone", () => {
    render(<Separator />);
    expect((separatorProps()["style"] as unknown[])[0]).toEqual({
      backgroundColor: "color:separator",
    });
    expect(separatorProps()["variant"]).toBeUndefined();
    expect(separatorProps()).not.toHaveProperty("orientation");
  });

  it("puts the caller's style after its own", () => {
    render(<Separator style={{ marginTop: 4 }} />);
    expect((separatorProps()["style"] as unknown[])[1]).toEqual({ marginTop: 4 });
  });

  it("passes the orientation, thickness, class and test id through", () => {
    render(<Separator orientation="vertical" thickness={6} className="mine" testID="rule" />);
    expect(separatorProps()).toMatchObject({
      orientation: "vertical",
      thickness: 6,
      className: "mine",
      testID: "rule",
    });
  });

  it("types: extends the contract, takes HeroUI Native's orientations and refuses its thickness variants", () => {
    expectTypeOf<SeparatorProps>().toExtend<SeparatorContractProps>();
    expectTypeOf<Orientation>().toEqualTypeOf<SeparatorOrientation>();
    // @ts-expect-error `thick` is HeroUI Native's thickness; the contract's variants are colour levels
    render(<Separator variant="thick" />);
    render(<Separator thickness={2} />);
  });
});
