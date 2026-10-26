/**
 * Stackra file contract:
 * Purpose: proves the native TrendChip hands HeroUI Native Pro's chip the shared `size` and `TrendChipVariant`
 *          variant, leaves them out when the caller left them out, passes the trend direction and every other prop through, and exposes
 *          HeroUI Native Pro's own parts and hook.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/trend-chip subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  TrendChip as HeroTrendChip,
  useTrendChip as heroUseTrendChip,
} from "heroui-native-pro/trend-chip";
import type { ReactNode } from "react";

import { TrendChipVariant } from "#contracts/enums/trend-chip-variant.enum";
import type { TrendChipContractProps } from "#contracts/types/trend-chip-contract-props.type";
import { TrendChip, useTrendChip } from "#native/trend-chip/trend-chip";
import type { TrendChipProps } from "#native/trend-chip/trend-chip.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/trend-chip", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    TrendChip: Object.assign(root, {
      Indicator: part(),
      Value: part(),
      Prefix: part(),
      Suffix: part(),
    }),
    useTrendChip: () => undefined,
  };
});

describe("TrendChip (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(TrendChipVariant)("hands HeroUI Native Pro the %s variant", (variant) => {
    render(<TrendChip variant={variant} />);
    expect(received.props).toMatchObject({ variant });
  });

  it.each(["sm", "md", "lg"] as const)("hands HeroUI Native Pro the %s size", (size) => {
    render(<TrendChip size={size} />);
    expect(received.props).toMatchObject({ size });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<TrendChip />);
    expect(received.props).not.toHaveProperty("size");
    expect(received.props).not.toHaveProperty("variant");
  });

  it("passes the trend direction and every other prop through", () => {
    render(<TrendChip trend="up" testID="found" />);
    expect(received.props).toMatchObject({ trend: "up", testID: "found" });
  });

  it.each(["Indicator", "Value", "Prefix", "Suffix"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(TrendChip[name]).toBe(HeroTrendChip[name]);
    },
  );

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useTrendChip).toBe(heroUseTrendChip);
  });

  it("extends its contract and refuses a variant outside the shared set", () => {
    expectTypeOf<TrendChipProps>().toExtend<TrendChipContractProps>();
    // @ts-expect-error a variant outside the shared set is refused
    void (<TrendChip variant="outline" />);
  });
});
