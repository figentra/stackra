/**
 * Stackra file contract:
 * Purpose: proves the native Timeline passes every prop of the root through unchanged, and exposes HeroUI Native Pro's own parts and hooks.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro/timeline subpath is replaced by a
 *          recording stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-008
import { render } from "@testing-library/react";
import {
  Timeline as HeroTimeline,
  useTimeline as heroUseTimeline,
  useTimelineItem as heroUseTimelineItem,
} from "heroui-native-pro/timeline";
import type { ReactNode } from "react";

import { Timeline, useTimeline, useTimelineItem } from "#native/timeline/timeline";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/timeline", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Timeline: Object.assign(root, {
      Item: part(),
      Leading: part(),
      Rail: part(),
      Marker: part(),
      Connector: part(),
      Content: part(),
      Title: part(),
      Description: part(),
    }),
    useTimeline: () => undefined,
    useTimelineItem: () => undefined,
  };
});

describe("Timeline (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("passes every prop through unchanged", () => {
    render(
      <Timeline size="lg" density="compact" itemAlign="center" testID="found">
        {null}
      </Timeline>,
    );
    expect(received.props).toMatchObject({
      size: "lg",
      density: "compact",
      itemAlign: "center",
      testID: "found",
    });
  });

  it.each([
    "Item",
    "Leading",
    "Rail",
    "Marker",
    "Connector",
    "Content",
    "Title",
    "Description",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Timeline[name]).toBe(HeroTimeline[name]);
  });

  it("re-exports HeroUI Native Pro's hooks", () => {
    expect(useTimeline).toBe(heroUseTimeline);
    expect(useTimelineItem).toBe(heroUseTimelineItem);
  });
});
