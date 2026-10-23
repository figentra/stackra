/**
 * Stackra file contract:
 * Purpose: proves the native NumberValue passes every prop of the root through unchanged, `numberStyle` included, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/number-value subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  NumberValue as HeroNumberValue,
  useNumberValue as heroUseNumberValue,
} from "heroui-native-pro/number-value";
import type { ReactNode } from "react";

import { NumberValue, useNumberValue } from "#native/number-value/number-value";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/number-value", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    NumberValue: Object.assign(root, {
      Value: part(),
      Prefix: part(),
      Suffix: part(),
    }),
    useNumberValue: () => undefined,
  };
});

describe("NumberValue (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("passes every prop through unchanged", () => {
    render(<NumberValue value={12} numberStyle="percent" locale="en-US" testID="found" />);
    expect(received.props).toMatchObject({
      value: 12,
      numberStyle: "percent",
      locale: "en-US",
      testID: "found",
    });
  });

  it.each(["Value", "Prefix", "Suffix"] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(NumberValue[name]).toBe(HeroNumberValue[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useNumberValue).toBe(heroUseNumberValue);
  });
});
