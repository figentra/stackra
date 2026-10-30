/**
 * Stackra file contract:
 * Purpose: proves the native ContextMenu opens its Menu on a long press or the screen reader's long-press action, not
 *          on the trigger's own tap, closes when the Menu asks, passes `onAction` on, and opens nothing when disabled.
 * Boundary: react-native's Pressable, the native Menu and haptics are replaced by recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ContextMenu } from "#native/context-menu/context-menu";

const received = vi.hoisted(() => ({
  menu: {} as Record<string, unknown>,
  area: {} as Record<string, unknown>,
}));

vi.mock("react-native", () => ({
  Pressable: (props: Record<string, unknown> & { children?: ReactNode }) => {
    received.area = props;
    return <div>{props.children}</div>;
  },
}));
vi.mock("#native/menu/menu", () => ({
  Menu: (props: Record<string, unknown> & { children?: ReactNode }) => {
    received.menu = props;
    return <div>{props.children}</div>;
  },
}));
vi.mock("#native/haptics/haptics", () => ({ haptics: { play: () => undefined } }));

/** An action handler the menu must receive as is. */
const onAction = () => undefined;

const SECTIONS = [{ id: "row", title: "Row", items: [{ id: "copy", label: "Copy" }] }];

describe("ContextMenu (native)", () => {
  it("opens on a long press only and closes when the menu asks", () => {
    render(
      <ContextMenu sections={SECTIONS} label="Order actions" onAction={onAction}>
        Row
      </ContextMenu>,
    );
    expect(received.menu["isOpen"]).toBe(false);
    expect(received.menu["onAction"]).toBe(onAction);
    act(() => (received.menu["onOpenChange"] as (open: boolean) => void)(true));
    expect(received.menu["isOpen"]).toBe(false);
    act(() => (received.area["onLongPress"] as () => void)());
    expect(received.menu["isOpen"]).toBe(true);
    act(() => (received.menu["onOpenChange"] as (open: boolean) => void)(false));
    expect(received.menu["isOpen"]).toBe(false);
  });

  it("opens from the screen reader's long-press action, named by the label", () => {
    render(
      <ContextMenu sections={SECTIONS} label="Order actions">
        Row
      </ContextMenu>,
    );
    expect(received.area["accessibilityActions"]).toEqual([
      { name: "longpress", label: "Order actions" },
    ]);
    act(() =>
      (received.area["onAccessibilityAction"] as (event: unknown) => void)({
        nativeEvent: { actionName: "longpress" },
      }),
    );
    expect(received.menu["isOpen"]).toBe(true);
  });

  it("opens nothing when disabled", () => {
    render(
      <ContextMenu sections={SECTIONS} label="Order actions" isDisabled>
        Row
      </ContextMenu>,
    );
    act(() => (received.area["onLongPress"] as () => void)());
    expect(received.menu["isOpen"]).toBe(false);
    expect(received.area["accessibilityActions"]).toEqual([]);
  });
});
