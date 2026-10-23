/**
 * Stackra file contract:
 * Purpose: proves the native AlertDialog is HeroUI Native's Dialog announced as an `alertdialog`, draws the title, the
 *          description, the tone's icon in its soft circle (or none, or the caller's), turns a press outside into
 *          `isDismissable` alone, lets the back button refuse the question unless `isKeyboardDismissDisabled` is set,
 *          allows the swipe only when both may dismiss, confirms and refuses through its buttons, colours the confirm
 *          button by tone, refuses a confirming press while disabled, wraps a string child in Text, follows a
 *          controlled state, and passes content props through.
 * Boundary: React Native does not render in vitest, so react-native, heroui-native, the Button, the icon slot and the
 *           Text are replaced by recording stand-ins that render plain DOM; what reaches them is checked, not how they
 *           draw.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 4.1.2; ADR
 *          0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-102
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";
import { AlertDialog, type AlertDialogProps } from "#native/alert-dialog/alert-dialog";

/** The props the stand-ins were last handed, by part. */
const received = vi.hoisted(() => ({
  root: {} as Record<string, unknown>,
  overlay: {} as Record<string, unknown>,
  content: {} as Record<string, unknown>,
  views: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  lucide: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("lucide-react-native", async () => {
  const { createElement } = await import("react");
  return {
    LucideProvider: (props: Record<string, unknown>) => {
      received.lucide = props;
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const text = (tag: string) => (props: Record<string, unknown>) =>
    createElement(tag, null, props["children"] as ReactNode);
  const Dialog = Object.assign(
    (props: Record<string, unknown>) => {
      received.root = props;
      return props["isOpen"] ? createElement("div", null, props["children"] as ReactNode) : null;
    },
    {
      Portal: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as ReactNode),
      Overlay: (props: Record<string, unknown>) => {
        received.overlay = props;
        return null;
      },
      Content: (props: Record<string, unknown>) => {
        received.content = props;
        return createElement("div", { "data-testid": "content" }, props["children"] as ReactNode);
      },
      Title: text("h2"),
      Description: text("p"),
    },
  );
  return { Dialog, useThemeColor: (colour: string) => `colour:${colour}` };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      received.buttons.push(props);
      return createElement(
        "button",
        {
          disabled: props["isDisabled"] === true,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/slot-icon/slot-icon", async () => {
  const { createElement } = await import("react");
  return {
    SlotIcon: ({ icon }: { readonly icon?: unknown }) =>
      typeof icon === "string"
        ? createElement("i", { "data-testid": "slot-icon", "data-name": icon })
        : (icon ?? null),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", { "data-testid": "text" }, props["children"] as ReactNode),
  };
});

const ui = (props: Partial<AlertDialogProps> = {}) => (
  <AlertDialog
    title="Delete project?"
    description="This cannot be undone."
    confirmLabel="Delete"
    cancelLabel="Keep"
    defaultOpen
    {...props}
  />
);

/** Whether the content allows the swipe-down dismissal for a dialog drawn with `props`. */
const swipeable = (props: Partial<AlertDialogProps>) => {
  const { unmount } = render(ui(props));
  const value = received.content["isSwipeable"];
  unmount();
  return value;
};

const iconNames = () =>
  screen.queryAllByTestId("slot-icon").map((node) => node.getAttribute("data-name"));
const lastButton = (label: string) =>
  received.buttons.findLast((props) => props["children"] === label);

describe("AlertDialog (native)", () => {
  beforeEach(() => {
    received.root = {};
    received.overlay = {};
    received.content = {};
    received.views = [];
    received.buttons = [];
    received.lucide = {};
  });

  it("draws nothing while closed and opens from defaultOpen", () => {
    const { unmount } = render(ui({ defaultOpen: false }));
    expect(screen.queryByTestId("content")).toBeNull();
    unmount();
    render(ui());
    expect(screen.getByTestId("content")).toBeTruthy();
  });

  it("is announced as an alertdialog, with the title and the description", () => {
    render(ui());
    expect(received.content).toMatchObject({ role: "alertdialog" });
    expect(screen.getByRole("heading", { name: "Delete project?" })).toBeTruthy();
    expect(screen.getByText("This cannot be undone.")).toBeTruthy();
  });

  it("draws no description when it has none", () => {
    render(ui({ description: undefined }));
    expect(screen.queryByText("This cannot be undone.")).toBeNull();
  });

  it.each([
    ["default", "info", "colour:default", "colour:foreground"],
    ["accent", "info", "colour:accent-soft", "colour:accent-soft-foreground"],
    ["success", "circle-check", "colour:success-soft", "colour:success-soft-foreground"],
    ["warning", "triangle-alert", "colour:warning-soft", "colour:warning-soft-foreground"],
    ["danger", "circle-alert", "colour:danger-soft", "colour:danger-soft-foreground"],
  ] as const)(
    "draws the %s tone's icon in its soft circle",
    (tone, name, background, foreground) => {
      render(ui({ tone }));
      expect(iconNames()).toEqual([name]);
      expect(
        received.views.some((view) => String(JSON.stringify(view["style"])).includes(background)),
      ).toBe(true);
      expect(received.lucide).toMatchObject({ color: foreground, size: 20 });
    },
  );

  it("draws an icon of the caller's, or none", () => {
    const { unmount } = render(ui({ icon: "trash", tone: "danger" }));
    expect(iconNames()).toEqual(["trash"]);
    unmount();
    render(ui({ icon: false }));
    expect(iconNames()).toEqual([]);
  });

  it("turns a press outside into isDismissable alone", () => {
    const onCancel = vi.fn();
    const { unmount } = render(ui({ onCancel }));
    expect(received.overlay["isCloseOnPress"]).toBe(false);
    expect(received.overlay["onPress"]).toBeUndefined();
    unmount();
    render(ui({ onCancel, isDismissable: true }));
    expect(received.overlay["isCloseOnPress"]).toBe(false);
    act(() => (received.overlay["onPress"] as () => void)());
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("lets the back button refuse the question unless it is disabled", () => {
    const onCancel = vi.fn();
    const { unmount } = render(ui({ onCancel, isKeyboardDismissDisabled: true }));
    act(() => (received.root["onOpenChange"] as (next: boolean) => void)(false));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByTestId("content")).toBeTruthy();
    unmount();
    render(ui({ onCancel }));
    act(() => (received.root["onOpenChange"] as (next: boolean) => void)(false));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("allows the swipe only when a press outside and the back button may both dismiss", () => {
    expect(swipeable({})).toBe(false);
    expect(swipeable({ isDismissable: true })).toBe(true);
    expect(swipeable({ isDismissable: true, isKeyboardDismissDisabled: true })).toBe(false);
  });

  it("confirms: calls onConfirm once, never onCancel, reports closing and closes", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(ui({ onConfirm, onCancel, onOpenChange }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("refuses with the cancel button: calls onCancel once, never onConfirm, and closes", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(ui({ onConfirm, onCancel }));
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("puts the cancel button before the confirm button and colours the confirm by tone", () => {
    const { unmount } = render(ui({ tone: "danger" }));
    expect(screen.getAllByRole("button").map((node) => node.textContent)).toEqual([
      "Keep",
      "Delete",
    ]);
    expect(lastButton("Keep")).toMatchObject({ variant: "secondary" });
    expect(lastButton("Delete")).toMatchObject({ variant: "danger" });
    unmount();
    render(ui({ tone: "warning" }));
    expect(lastButton("Delete")).toMatchObject({ variant: "primary" });
  });

  it("refuses a confirming press while isConfirmDisabled", () => {
    const onConfirm = vi.fn();
    render(ui({ isConfirmDisabled: true, onConfirm }));
    const confirm = screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(lastButton("Delete")).toMatchObject({ isDisabled: true });
    fireEvent.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("follows a controlled isOpen and only asks to change it", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(ui({ isOpen: true, defaultOpen: false, onOpenChange }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByTestId("content")).toBeTruthy();
    rerender(ui({ isOpen: false, defaultOpen: false, onOpenChange }));
    expect(screen.queryByTestId("content")).toBeNull();
  });

  it("wraps a string child in Text and draws an element as given", () => {
    const { unmount } = render(ui({ children: "Type the name." }));
    expect(screen.getByTestId("text").textContent).toBe("Type the name.");
    unmount();
    render(ui({ children: <b data-testid="mine">Type the name.</b> }));
    expect(screen.queryByTestId("text")).toBeNull();
    expect(screen.getByTestId("mine")).toBeTruthy();
  });

  it("passes content props through and refuses HeroUI's names and a missing label", () => {
    render(ui({ className: "mine" }));
    expect(received.content).toMatchObject({ className: "mine" });
    expectTypeOf<AlertDialogProps>().toExtend<AlertDialogContractProps>();
    // @ts-expect-error HeroUI Native's own name for the starting state is `isDefaultOpen`; the contract's is `defaultOpen`
    void (<AlertDialog title="t" confirmLabel="c" cancelLabel="x" isDefaultOpen />);
    // @ts-expect-error the buttons' words are the app's, so the labels are required
    void (<AlertDialog title="t" />);
  });
});
