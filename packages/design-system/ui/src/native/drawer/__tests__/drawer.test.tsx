/**
 * Stackra file contract:
 * Purpose: proves the native Drawer, the adapted form on HeroUI Native's BottomSheet, hands the sheet the open state
 *          under its own names (`isDefaultOpen`), turns `isDismissable` into both the overlay's `isCloseOnPress` and
 *          the content's `enablePanDownToClose`, wraps the `trigger` in the sheet trigger, names the content by
 *          `label`, passes the other sheet props through without leaking `placement` or
 *          `isKeyboardDismissDisabled` into them, asks VoiceOver to stay inside, shares the modal's header, body and
 *          footer, and refuses the raw HeroUI Native names the contract replaces and any side but the bottom.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native, Text and the icon slot are
 *           replaced by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not how it
 *           draws.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0312; WCAG 2.2 SC 2.1.2 and 4.1.2; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-100 sta-350:FR-098
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DrawerContractProps } from "#contracts/types/drawer-contract-props.type";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";
import { Drawer } from "#native/drawer/drawer";
import { DrawerHandle } from "#native/drawer/drawer-handle";
import type { DrawerProps } from "#native/drawer/drawer.props";
import type { DrawerTitleProps } from "#native/drawer/drawer-title.props";
import { ModalBody } from "#native/modal/modal-body";
import { ModalFooter } from "#native/modal/modal-footer";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

/** The screen width `useWindowDimensions` reports: a phone unless a test says otherwise. */
const screenSize = vi.hoisted(() => ({ width: 390 }));

/** What a sheet's or a panel's own open state was last told. */
const closed = vi.hoisted(() => ({ sheet: vi.fn(), panel: vi.fn() }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    BottomSheet: Object.assign(record("sheet"), {
      Trigger: record("trigger"),
      Portal: record("portal"),
      Overlay: record("overlay"),
      Content: record("content"),
      Title: record("title"),
      Close: record("close"),
    }),
    Dialog: Object.assign(record("dialog"), {
      Trigger: record("dialog-trigger"),
      Portal: record("dialog-portal"),
      Overlay: record("dialog-overlay"),
      Content: record("dialog-content"),
      Title: record("dialog-title"),
      Close: record("dialog-close"),
    }),
    useBottomSheet: () => ({ isOpen: true, onOpenChange: closed.sheet }),
    useDialog: () => ({ isOpen: true, onOpenChange: closed.panel }),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    useWindowDimensions: () => ({ width: screenSize.width, height: 800 }),
  };
});

vi.mock("react-native-reanimated", () => ({
  SlideInLeft: "SlideInLeft",
  SlideInRight: "SlideInRight",
  SlideOutLeft: "SlideOutLeft",
  SlideOutRight: "SlideOutRight",
}));

vi.mock("#native/view-stack/view-stack", () => ({
  ViewStack: Object.assign(() => null, { View: () => null, Back: () => null }),
}));

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: { readonly label: string; readonly onPress: () => void }) =>
      createElement("button", {
        type: "button",
        "aria-label": props.label,
        onClick: props.onPress,
      }),
  };
});

vi.mock("#native/modal/back-button-block", () => ({
  BackButtonBlock: (props: Record<string, unknown>) => {
    received.props["back-block"] = props;
    return null;
  },
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/slot-icon/slot-icon", async () => {
  const { createElement } = await import("react");
  return {
    SlotIcon: ({ icon }: { readonly icon?: unknown }) =>
      typeof icon === "string" ? createElement("i", { "data-name": icon }) : (icon ?? null),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("Drawer (native)", () => {
  beforeEach(() => {
    received.props = {};
    screenSize.width = 390;
  });

  it("hands the controlled open state to the sheet, and `defaultOpen` as `isDefaultOpen`", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Drawer isOpen onOpenChange={onOpenChange}>
        x
      </Drawer>,
    );
    expect(propsOf("sheet")).toMatchObject({ isOpen: true, onOpenChange });
    expect(propsOf("sheet")).not.toHaveProperty("isDefaultOpen");
    rerender(<Drawer defaultOpen>x</Drawer>);
    expect(propsOf("sheet")).toMatchObject({ isDefaultOpen: true });
    expect(propsOf("sheet")).not.toHaveProperty("defaultOpen");
    expect(propsOf("sheet")).not.toHaveProperty("isOpen");
  });

  it("wraps the trigger in the sheet trigger, and draws none without one", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <Drawer trigger={<i data-testid="mine" />}>x</Drawer>,
    );
    expect(propsOf("trigger")["asChild"]).toBe(true);
    expect(getByTestId("trigger").querySelector('[data-testid="mine"]')).toBeTruthy();
    rerender(<Drawer>x</Drawer>);
    expect(queryByTestId("trigger")).toBeNull();
  });

  it("closes on an overlay press and a downward swipe by default", () => {
    render(<Drawer>x</Drawer>);
    expect(propsOf("overlay")["isCloseOnPress"]).toBe(true);
    expect(propsOf("content")["enablePanDownToClose"]).toBe(true);
    expect(propsOf("content")).toMatchObject({
      detached: true,
      bottomInset: 32,
      className: "mx-4",
      backgroundClassName: "rounded-[var(--radius-container)]",
    });
  });

  it("refuses both when `isDismissable` is false", () => {
    render(<Drawer isDismissable={false}>x</Drawer>);
    expect(propsOf("overlay")["isCloseOnPress"]).toBe(false);
    expect(propsOf("content")["enablePanDownToClose"]).toBe(false);
  });

  it("names the content by `label` and leaves it unnamed without one", () => {
    const { rerender } = render(<Drawer label="Filters">x</Drawer>);
    expect(propsOf("content")["accessibilityLabel"]).toBe("Filters");
    rerender(<Drawer>x</Drawer>);
    expect(propsOf("content")).not.toHaveProperty("accessibilityLabel");
  });

  it("passes the other sheet props through and keeps the portal modal for VoiceOver", () => {
    render(
      <Drawer snapPoints={["50%"]} detached index={0}>
        x
      </Drawer>,
    );
    expect(propsOf("content")).toMatchObject({ snapPoints: ["50%"], detached: true, index: 0 });
    expect(propsOf("portal")["unstable_accessibilityContainerViewIsModal"]).toBe(true);
  });

  it("accepts `placement` and `isKeyboardDismissDisabled` for the shared call site without handing them on", () => {
    render(
      <Drawer placement="bottom" isKeyboardDismissDisabled>
        x
      </Drawer>,
    );
    for (const name of ["sheet", "content", "overlay", "portal"]) {
      expect(propsOf(name), name).not.toHaveProperty("placement");
      expect(propsOf(name), name).not.toHaveProperty("isKeyboardDismissDisabled");
    }
  });

  it("shares the modal's body and footer, and exposes the contract parts", () => {
    expect(Drawer.Body).toBe(ModalBody);
    expect(Drawer.Footer).toBe(ModalFooter);
    expect(Object.keys(Drawer).sort()).toEqual([
      "Back",
      "Body",
      "Close",
      "Description",
      "Footer",
      "Header",
      "SubHeader",
      "Title",
      "View",
      "ViewStack",
    ]);
  });

  it("draws a start or end drawer as a floating side panel on a tablet, and a sheet on a phone", () => {
    screenSize.width = 1024;
    render(
      <Drawer defaultOpen size="lg" isKeyboardDismissDisabled>
        <Drawer.Header>
          <Drawer.Title>Edit</Drawer.Title>
          <Drawer.Close label="Close" />
        </Drawer.Header>
      </Drawer>,
    );
    expect(propsOf("dialog")["isDefaultOpen"]).toBe(true);
    expect(propsOf("dialog-portal")["className"]).toContain("items-end");
    expect(propsOf("dialog-content")["className"]).toContain("w-drawer-lg");
    expect(propsOf("dialog-content")["className"]).toContain("rounded-[var(--radius-container)]");
    expect(propsOf("dialog-content")["style"]).toMatchObject({
      marginBottom: 28,
      marginHorizontal: 8,
    });
    expect(propsOf("dialog-title")["children"]).toBe("Edit");
    expect(propsOf("dialog-close")["accessibilityLabel"]).toBe("Close");
    expect(propsOf("back-block")["isBlocked"]).toBe(true);
    expect(propsOf("sheet")).toEqual({});
    received.props = {};
    render(<Drawer placement="start">x</Drawer>);
    expect(propsOf("dialog-portal")["className"]).toContain("items-start");
    received.props = {};
    render(<Drawer placement="bottom">x</Drawer>);
    expect(propsOf("dialog")).toEqual({});
    expect(propsOf("content")["detached"]).toBe(true);
  });

  it("shows Back only on a drawer stacked over another, and it closes just that layer", () => {
    const { getByRole, queryByRole } = render(
      <Drawer defaultOpen>
        <Drawer.Header>
          <Drawer.Title>Order</Drawer.Title>
        </Drawer.Header>
        <Drawer defaultOpen>
          <Drawer.Header>
            <Drawer.Title>Customer</Drawer.Title>
          </Drawer.Header>
        </Drawer>
      </Drawer>,
    );
    const back = getByRole("button", { name: "Back" });
    expect(queryByRole("button", { name: "Back" })).toBe(back);
    back.click();
    expect(closed.sheet).toHaveBeenCalledWith(false);
  });

  it("hands the title to the sheet title without its level", () => {
    render(
      <Drawer.Title level={4} numberOfLines={1}>
        Filters
      </Drawer.Title>,
    );
    expect(propsOf("title")).not.toHaveProperty("level");
    expect(propsOf("title")["numberOfLines"]).toBe(1);
    expect(propsOf("title")["children"]).toBe("Filters");
  });

  it("names the close button by `label`, hands over its press and disabled flag, and draws an icon in the mark's place", () => {
    const onPress = vi.fn();
    const { container, rerender } = render(<Drawer.Close label="Close" />);
    expect(propsOf("close")["accessibilityLabel"]).toBe("Close");
    expect(propsOf("close")["children"]).toBeUndefined();
    rerender(<Drawer.Close label="Dismiss" onPress={onPress} isDisabled icon="circle-x" />);
    expect(propsOf("close")).toMatchObject({
      accessibilityLabel: "Dismiss",
      onPress,
      isDisabled: true,
    });
    expect(container.querySelector("i")?.getAttribute("data-name")).toBe("circle-x");
  });

  it("types: extends the contracts and refuses the raw names", () => {
    expectTypeOf<DrawerProps>().toExtend<DrawerContractProps>();
    expectTypeOf<DrawerTitleProps>().toExtend<OverlayTitleContractProps>();
    expectTypeOf<DrawerProps>().not.toHaveProperty("isDefaultOpen");
    expectTypeOf<DrawerProps>().not.toHaveProperty("enablePanDownToClose");
  });

  it("hands the snap points to the sheet as a fresh array", () => {
    const snapPoints = [240, "80%"] as const;
    render(<Drawer snapPoints={snapPoints}>x</Drawer>);
    expect(propsOf("content")["snapPoints"]).toEqual([240, "80%"]);
  });

  it("draws the resize handle and tracks the snap point only with two or more snap points", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Drawer snapPoints={[240, "80%"]} onChange={onChange}>
        x
      </Drawer>,
    );
    expect(propsOf("content")["handleComponent"]).toBe(DrawerHandle);
    (propsOf("content")["onChange"] as (index: number, position: number, type: number) => void)(
      1,
      200,
      0,
    );
    expect(onChange).toHaveBeenCalledWith(1, 200, 0);
    rerender(<Drawer snapPoints={["50%"]}>x</Drawer>);
    expect(propsOf("content")["handleComponent"]).toBeUndefined();
  });
});
