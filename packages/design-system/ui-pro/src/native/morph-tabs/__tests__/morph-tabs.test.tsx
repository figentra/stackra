/**
 * Stackra file contract:
 * Purpose: proves the native MorphTabs names its tab list from `label` as the accessibility label, leaves it out when
 *          the caller did, passes every other prop and the imperative `ref` through, exposes HeroUI Native Pro's own
 *          parts and hooks, and refuses its accessibility label names.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-011
import { render } from "@testing-library/react";
import {
  MorphTabs as HeroMorphTabs,
  useMorphTabs as heroUseMorphTabs,
  useMorphTabsTrigger as heroUseMorphTabsTrigger,
} from "heroui-native-pro/morph-tabs";
import { createRef, type ReactNode } from "react";

import type { MorphTabsListContractProps } from "#contracts/types/morph-tabs-contract-props.type";
import {
  MorphTabs,
  useMorphTabs,
  useMorphTabsTrigger,
  type MorphTabsListProps,
} from "#native/morph-tabs/morph-tabs";

/** The props the root and the list stand-ins were last handed, as the real components would receive them. */
const received = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  list: {} as Record<string, unknown>,
}));

vi.mock("heroui-native-pro/morph-tabs", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const recording = (key: "root" | "list") => (props: Record<string, unknown>) => {
    received[key] = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    MorphTabs: Object.assign(recording("root"), {
      List: recording("list"),
      Trigger: part(),
      TriggerBackground: part(),
      Icon: part(),
      Label: part(),
      Pager: part(),
      Content: part(),
    }),
    useMorphTabs: () => ({}),
    useMorphTabsTrigger: () => ({}),
  };
});

describe("MorphTabs (native)", () => {
  beforeEach(() => {
    received.root = {};
    received.list = {};
  });

  it("passes the root's props, the layout props and the imperative ref through unchanged", () => {
    const onValueChange = vi.fn();
    const ref = createRef<React.ComponentRef<typeof HeroMorphTabs>>();
    render(
      <MorphTabs ref={ref} defaultValue="home" onValueChange={onValueChange} testID="found" />,
    );
    expect(received.root).toMatchObject({
      ref,
      defaultValue: "home",
      onValueChange,
      testID: "found",
    });
  });

  it("maps the list's label to the accessibility label, and passes its other props through", () => {
    render(<MorphTabs.List label="Sections" testID="found" />);
    expect(received.list).toMatchObject({ accessibilityLabel: "Sections", testID: "found" });
    expect(received.list).not.toHaveProperty("label");
  });

  it("leaves the list unnamed when no label is given", () => {
    render(<MorphTabs.List />);
    expect(received.list).not.toHaveProperty("accessibilityLabel");
  });

  it.each(["Trigger", "TriggerBackground", "Icon", "Label", "Pager", "Content"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(MorphTabs[name]).toBe(HeroMorphTabs[name]);
    },
  );

  it("exposes HeroUI Native Pro's own hooks", () => {
    expect(useMorphTabs).toBe(heroUseMorphTabs);
    expect(useMorphTabsTrigger).toBe(heroUseMorphTabsTrigger);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<MorphTabsListProps>().toExtend<MorphTabsListContractProps>();
    // @ts-expect-error the list's accessible name is `label`
    void (<MorphTabs.List accessibilityLabel="x" />);
  });
});
