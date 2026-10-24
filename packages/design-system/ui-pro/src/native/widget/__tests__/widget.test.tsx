/**
 * Stackra file contract:
 * Purpose: proves the native Widget passes every prop of the root through unchanged, and exposes HeroUI Native Pro's own parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/widget subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import { Widget as HeroWidget } from "heroui-native-pro/widget";
import type { ReactNode } from "react";

import { Widget } from "#native/widget/widget";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/widget", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Widget: Object.assign(root, {
      Background: part(),
      Header: part(),
      Title: part(),
      Description: part(),
      Content: part(),
      Footer: part(),
      Legend: part(),
      LegendItem: part(),
    }),
  };
});

describe("Widget (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("passes every prop through unchanged", () => {
    render(<Widget testID="found" className="extra" />);
    expect(received.props).toMatchObject({ testID: "found", className: "extra" });
  });

  it.each([
    "Background",
    "Header",
    "Title",
    "Description",
    "Content",
    "Footer",
    "Legend",
    "LegendItem",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Widget[name]).toBe(HeroWidget[name]);
  });
});
