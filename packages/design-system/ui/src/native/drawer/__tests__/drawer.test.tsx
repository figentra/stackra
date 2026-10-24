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
import { Drawer, type DrawerProps } from "#native/drawer/drawer";
import type { DrawerTitleProps } from "#native/drawer/drawer-title";
import { ModalBody, ModalFooter, ModalHeader } from "#native/modal/modal-section";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

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
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});

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
      backgroundClassName: "rounded-4xl",
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

  it("shares the modal's header, body and footer, and exposes the five contract parts", () => {
    expect(Drawer.Header).toBe(ModalHeader);
    expect(Drawer.Body).toBe(ModalBody);
    expect(Drawer.Footer).toBe(ModalFooter);
    expect(Object.keys(Drawer).sort()).toEqual(["Body", "Close", "Footer", "Header", "Title"]);
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

  it("types: extends the contracts, takes only the bottom side and refuses the raw names", () => {
    expectTypeOf<DrawerProps>().toExtend<DrawerContractProps>();
    expectTypeOf<DrawerTitleProps>().toExtend<OverlayTitleContractProps>();
    expectTypeOf<DrawerProps["placement"]>().toEqualTypeOf<"bottom" | undefined>();
    expectTypeOf<DrawerProps>().not.toHaveProperty("isDefaultOpen");
    expectTypeOf<DrawerProps>().not.toHaveProperty("enablePanDownToClose");
  });
});
