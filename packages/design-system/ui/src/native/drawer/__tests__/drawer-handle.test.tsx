/**
 * Stackra file contract:
 * Purpose: proves the native `DrawerHandle` is one adjustable element named by the resize word, speaks its snap point
 *          as a position among them, steps one snap point on the screen reader's increment and decrement, cycles on
 *          activate, and draws the bar alone outside a snap drawer.
 * Boundary: `react-native` is a stand-in that records the handle's props; `useUiText` writes the key.
 * Runtime: node
 * Governing contract: STA-1371 (drawer resize on native); WCAG 2.2 SC 2.5.7 and 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { DrawerHandle } from "#native/drawer/drawer-handle";
import { DrawerSnapContext } from "#native/drawer/drawer-snap-context";

/** The props of every View drawn, in order. */
const views = vi.hoisted(() => ({ props: [] as Record<string, unknown>[] }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      views.props.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

/** The handle's own props: the outer View. */
const handle = () => views.props.find((props) => props["accessible"] === true) ?? {};
const fire = (actionName: string) =>
  (handle()["onAccessibilityAction"] as (event: { nativeEvent: { actionName: string } }) => void)({
    nativeEvent: { actionName },
  });

describe("DrawerHandle (native)", () => {
  beforeEach(() => {
    views.props = [];
  });

  it("is an adjustable resize handle that steps and cycles the snap points", () => {
    const snapTo = vi.fn();
    render(
      <DrawerSnapContext value={{ index: 1, count: 3, snapTo }}>
        <DrawerHandle />
      </DrawerSnapContext>,
    );
    expect(handle()).toMatchObject({
      accessibilityRole: "adjustable",
      accessibilityLabel: "ui::drawer.resize",
      accessibilityValue: { min: 1, max: 3, now: 2 },
    });
    fire("increment");
    fire("decrement");
    fire("activate");
    expect(snapTo.mock.calls).toEqual([[2], [0], [2]]);
  });

  it("draws the bar alone outside a snap drawer", () => {
    render(<DrawerHandle />);
    expect(views.props.some((props) => props["accessible"] === true)).toBe(false);
  });
});
