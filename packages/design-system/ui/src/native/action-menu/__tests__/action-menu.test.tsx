/**
 * Stackra file contract:
 * Purpose: proves the native ActionMenu gives its Menu the sections, the action handler and the open state, opens at
 *          the button's end by default and at the app's side when given one, puts an icon-only button named by `label`
 *          inside it (the `ellipsis` icon and the `ghost` variant unless given others) and hands it the size and the
 *          disabled state, passes other Menu props through, and that the type needs a label and sections and refuses a
 *          trigger and a selection.
 * Boundary: React Native does not render in vitest, so the native Menu and IconButton are replaced by recording
 *           stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-106 sta-350:FR-108
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ActionMenuContractProps } from "#contracts/types/action-menu-contract-props.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { ActionMenu, type ActionMenuProps } from "#native/action-menu/action-menu";

/** The props each stand-in was last handed, by name. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("#native/menu/menu", async () => {
  const { createElement } = await import("react");
  return {
    Menu: (props: Record<string, unknown>) => {
      received.props["menu"] = props;
      return createElement("div", { "data-testid": "menu" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      received.props["button"] = props;
      return createElement("button", { type: "button", "data-testid": "button" });
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

const SECTIONS: readonly MenuSection[] = [
  {
    id: "edit",
    title: "Edit",
    isTitleHidden: true,
    items: [{ id: "rename", label: "Rename" }],
  },
];

describe("ActionMenu (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("puts an icon-only button named by its label inside the menu, with the ellipsis and the ghost variant", () => {
    render(<ActionMenu label="Actions for order 1001" sections={SECTIONS} />);
    expect(screen.getByTestId("menu").querySelector('[data-testid="button"]')).toBeTruthy();
    expect(propsOf("button")).toMatchObject({
      label: "Actions for order 1001",
      icon: "ellipsis",
      variant: "ghost",
    });
  });

  it("hands the button the icon, the variant, the size and the disabled state", () => {
    const icon = <i data-testid="icon" />;
    render(
      <ActionMenu
        label="More"
        sections={SECTIONS}
        icon={icon}
        variant="secondary"
        size="lg"
        isDisabled
      />,
    );
    expect(propsOf("button")).toMatchObject({
      icon,
      variant: "secondary",
      size: "lg",
      isDisabled: true,
    });
  });

  it("gives the menu the sections, the handler and the open state, and passes other props through", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ActionMenu
        label="More"
        sections={SECTIONS}
        onAction={onAction}
        isOpen
        onOpenChange={onOpenChange}
        presentation="bottom-sheet"
      />,
    );
    expect(propsOf("menu")).toMatchObject({
      sections: SECTIONS,
      onAction,
      isOpen: true,
      onOpenChange,
      presentation: "bottom-sheet",
    });
    expect(propsOf("menu")).not.toHaveProperty("label");
    expect(propsOf("menu")).not.toHaveProperty("variant");
  });

  it("opens below the button at its end, or where the app says", () => {
    const { unmount } = render(<ActionMenu label="More" sections={SECTIONS} />);
    expect(propsOf("menu")).toMatchObject({ placement: "bottom", align: "end" });
    unmount();
    render(<ActionMenu label="More" sections={SECTIONS} placement="top" align="start" />);
    expect(propsOf("menu")).toMatchObject({ placement: "top", align: "start" });
  });

  it("types: extends the contract, needs a label and sections, and refuses a trigger and a selection", () => {
    expectTypeOf<ActionMenuProps>().toExtend<ActionMenuContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error nothing else names an icon-only button
    void (<ActionMenu sections={SECTIONS} />);
    // @ts-expect-error a menu needs its actions
    void (<ActionMenu label="More" />);
    void (
      (
        // @ts-expect-error the button is the component's own
        <ActionMenu label="More" sections={SECTIONS}>
          x
        </ActionMenu>
      )
    );
    // @ts-expect-error an action menu keeps no selection
    void (<ActionMenu label="More" sections={SECTIONS} selectionMode="single" />);
    // @ts-expect-error the starting state is `defaultOpen`
    void (<ActionMenu label="More" sections={SECTIONS} isDefaultOpen />);
  });
});
