/**
 * Stackra file contract:
 * Purpose: proves the native Modal hands HeroUI Native's Dialog the open state under its own names (`isDefaultOpen`),
 *          turns `isDismissable` into both the overlay's `isCloseOnPress` and the content's `isSwipeable`, wraps the
 *          `trigger` in the dialog trigger, maps `size` and `position` onto classes on the content and the portal (a
 *          full-screen dialog dropping the portal's padding), names the content by `label`, passes the other content
 *          props through, asks VoiceOver to stay inside, swallows the Android back button only while
 *          `isKeyboardDismissDisabled`, exposes the contract's five parts, and refuses the raw HeroUI Native names the
 *          contract replaces.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native, Text and the icon slot are
 *           replaced by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not how it
 *           draws.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 2.1.2 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-100
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ModalContractProps } from "#contracts/types/modal-contract-props.type";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";
import { Modal, type ModalProps } from "#native/modal/modal";
import type { ModalTitleProps } from "#native/modal/modal-title";

/** The props each stand-in was last handed, by name, and the back handlers React Native holds. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  backHandlers: [] as (() => boolean)[],
}));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Dialog: Object.assign(record("dialog"), {
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
    BackHandler: {
      addEventListener: (_event: string, handler: () => boolean) => {
        received.backHandlers.push(handler);
        return {
          remove: () => {
            received.backHandlers.splice(received.backHandlers.indexOf(handler), 1);
          },
        };
      },
    },
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

describe("Modal (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.backHandlers = [];
  });

  it("hands the controlled open state to the dialog, and `defaultOpen` as `isDefaultOpen`", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Modal isOpen onOpenChange={onOpenChange}>
        x
      </Modal>,
    );
    expect(propsOf("dialog")).toMatchObject({ isOpen: true, onOpenChange });
    expect(propsOf("dialog")).not.toHaveProperty("isDefaultOpen");
    rerender(<Modal defaultOpen>x</Modal>);
    expect(propsOf("dialog")).toMatchObject({ isDefaultOpen: true });
    expect(propsOf("dialog")).not.toHaveProperty("defaultOpen");
    expect(propsOf("dialog")).not.toHaveProperty("isOpen");
  });

  it("leaves the open state out of the dialog when the caller gives none", () => {
    render(<Modal>x</Modal>);
    for (const key of ["isOpen", "isDefaultOpen", "onOpenChange"])
      expect(propsOf("dialog"), key).not.toHaveProperty(key);
  });

  it("wraps the trigger in the dialog trigger, and draws none without one", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <Modal trigger={<i data-testid="mine" />}>x</Modal>,
    );
    expect(propsOf("trigger")["asChild"]).toBe(true);
    expect(getByTestId("trigger").querySelector('[data-testid="mine"]')).toBeTruthy();
    rerender(<Modal>x</Modal>);
    expect(queryByTestId("trigger")).toBeNull();
  });

  it("closes on an overlay press and a swipe by default", () => {
    render(<Modal>x</Modal>);
    expect(propsOf("overlay")["isCloseOnPress"]).toBe(true);
    expect(propsOf("content")["isSwipeable"]).toBe(true);
  });

  it("refuses both when `isDismissable` is false", () => {
    render(<Modal isDismissable={false}>x</Modal>);
    expect(propsOf("overlay")["isCloseOnPress"]).toBe(false);
    expect(propsOf("content")["isSwipeable"]).toBe(false);
  });

  it("is medium and centred by default", () => {
    render(<Modal>x</Modal>);
    expect(propsOf("content")["className"]).toBe("w-full max-w-[448px] self-center");
    expect(propsOf("portal")["className"]).toBe("");
  });

  it.each([
    ["sm", "w-full max-w-[320px] self-center"],
    ["md", "w-full max-w-[448px] self-center"],
    ["lg", "w-full max-w-[576px] self-center"],
    ["full", "flex-1 self-stretch rounded-none"],
  ] as const)("maps the %s size onto the content's classes", (size, expected) => {
    render(<Modal size={size}>x</Modal>);
    expect(propsOf("content")["className"]).toBe(expected);
    expect(propsOf("portal")["className"]).toBe(size === "full" ? "p-0" : "");
  });

  it.each([
    ["auto", ""],
    ["center", ""],
    ["top", "justify-start"],
    ["bottom", "justify-end"],
  ] as const)("maps the %s position onto the portal's alignment", (position, expected) => {
    render(<Modal position={position}>x</Modal>);
    expect(propsOf("portal")["className"]).toBe(expected);
  });

  it("keeps the caller's class after the size's", () => {
    render(<Modal className="bg-red-500">x</Modal>);
    expect(propsOf("content")["className"]).toBe("w-full max-w-[448px] self-center bg-red-500");
  });

  it("names the content by `label` and leaves it unnamed without one", () => {
    const { rerender } = render(<Modal label="Settings">x</Modal>);
    expect(propsOf("content")["accessibilityLabel"]).toBe("Settings");
    rerender(<Modal>x</Modal>);
    expect(propsOf("content")).not.toHaveProperty("accessibilityLabel");
  });

  it("passes the other content props through and keeps the portal modal for VoiceOver", () => {
    render(
      <Modal animation="disabled" background={null} testID="m">
        x
      </Modal>,
    );
    expect(propsOf("content")).toMatchObject({
      animation: "disabled",
      background: null,
      testID: "m",
    });
    expect(propsOf("portal")["unstable_accessibilityContainerViewIsModal"]).toBe(true);
  });

  it("swallows the hardware back button only while `isKeyboardDismissDisabled`", () => {
    const { rerender, unmount } = render(<Modal>x</Modal>);
    expect(received.backHandlers).toHaveLength(0);
    rerender(<Modal isKeyboardDismissDisabled>x</Modal>);
    expect(received.backHandlers).toHaveLength(1);
    // Reporting the press as handled is what keeps the dialog's own handler from closing it.
    expect(received.backHandlers[0]?.()).toBe(true);
    rerender(<Modal isKeyboardDismissDisabled={false}>x</Modal>);
    expect(received.backHandlers).toHaveLength(0);
    rerender(<Modal isKeyboardDismissDisabled>x</Modal>);
    unmount();
    expect(received.backHandlers).toHaveLength(0);
  });

  it("exposes the five contract parts", () => {
    expect(Object.keys(Modal).sort()).toEqual(["Body", "Close", "Footer", "Header", "Title"]);
  });

  it("hands the title to the dialog title without its level", () => {
    render(
      <Modal.Title level={4} numberOfLines={1}>
        Edit
      </Modal.Title>,
    );
    expect(propsOf("title")).not.toHaveProperty("level");
    expect(propsOf("title")["numberOfLines"]).toBe(1);
    expect(propsOf("title")["children"]).toBe("Edit");
  });

  it("names the close button by `label`, hands over its press and disabled flag, and draws an icon in the mark's place", () => {
    const onPress = vi.fn();
    const { container, rerender } = render(<Modal.Close label="Close" />);
    expect(propsOf("close")["accessibilityLabel"]).toBe("Close");
    expect(propsOf("close")["children"]).toBeUndefined();
    rerender(<Modal.Close label="Dismiss" onPress={onPress} isDisabled icon="circle-x" />);
    expect(propsOf("close")).toMatchObject({
      accessibilityLabel: "Dismiss",
      onPress,
      isDisabled: true,
    });
    expect(container.querySelector("i")?.getAttribute("data-name")).toBe("circle-x");
  });

  it("types: extends the contracts and refuses the raw names the contract replaces", () => {
    expectTypeOf<ModalProps>().toExtend<ModalContractProps>();
    expectTypeOf<ModalTitleProps>().toExtend<OverlayTitleContractProps>();
    expectTypeOf<ModalProps>().not.toHaveProperty("isDefaultOpen");
    expectTypeOf<ModalProps>().not.toHaveProperty("isSwipeable");
    expectTypeOf<ModalProps>().not.toHaveProperty("placement");
  });
});
