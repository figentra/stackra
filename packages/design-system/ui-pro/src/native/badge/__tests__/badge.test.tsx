/**
 * Stackra file contract:
 * Purpose: proves the native Badge hands HeroUI Native Pro `tone` as `color`, leaves out what the
 *          caller left out, passes every other prop through, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/badge subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import { Badge as HeroBadge, useBadge as heroUseBadge } from "heroui-native-pro/badge";
import type { ReactNode } from "react";

import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";
import { Badge, useBadge } from "#native/badge/badge";
import type { BadgeProps } from "#native/badge/badge.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/badge", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Badge: Object.assign(root, {
      Anchor: part(),
      Background: part(),
      Label: part(),
    }),
    useBadge: () => undefined,
  };
});

describe("Badge (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "maps the tone %s to HeroUI Native Pro's color",
    (tone) => {
      render(<Badge tone={tone} />);
      expect(received.props).toMatchObject({ color: tone });
      expect(received.props).not.toHaveProperty("tone");
    },
  );

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<Badge />);
    expect(received.props).not.toHaveProperty("color");
  });

  it("passes every other prop through unchanged", () => {
    render(<Badge tone="success" variant="soft" size="lg" placement="top-left" testID="found" />);
    expect(received.props).toMatchObject({
      variant: "soft",
      size: "lg",
      placement: "top-left",
      testID: "found",
    });
  });

  it.each(["Anchor", "Background", "Label"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(Badge[name]).toBe(HeroBadge[name]);
    },
  );

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useBadge).toBe(heroUseBadge);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<BadgeProps>().toExtend<BadgeContractProps>();
    // @ts-expect-error the colour role is `tone`
    void (<Badge color="success" />);
  });
});
