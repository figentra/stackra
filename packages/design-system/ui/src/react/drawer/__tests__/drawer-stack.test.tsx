/**
 * Stackra file contract:
 * Purpose: proves the web Drawer's floating layout and stacking: the header row puts the back button first and the
 *          close button last wherever they were written, shows the Esc hint only when Escape closes the drawer, takes
 *          a description and a sub-header, sizes and insets the panel; a drawer opened inside another is a layer over
 *          it that marks the one under covered, shows a back button that closes just that layer, closes alone on
 *          Escape and gives focus back to its opener in the layer under; a fourth layer warns; a view stack inside a
 *          drawer pops before the layer closes.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are
 *           checked, not looks (the playground's screenshots are).
 * Runtime: browser
 * Governing contract: owner request 2026-10-29 (STA-1371); ADR 0317 amendment 2026-10-28 (stacked overlays); WCAG 2.2
 *          SC 2.1.2, 2.4.3 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "#react/button/button";
import { Drawer } from "#react/drawer/drawer";
import type { DrawerProps } from "#react/drawer/drawer.props";
import { useViewStack } from "#react/view-stack/use-view-stack";

const press = (element: HTMLElement) => act(() => element.click());

/** The open dialogs, bottom layer first. */
const dialogs = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')];

/** A drawer with a title, whose body holds `children`. */
function Layer({
  title,
  children,
  ...props
}: Partial<DrawerProps> & { readonly title: string; readonly children?: ReactNode }): ReactElement {
  return (
    <Drawer trigger={<Button>{`Open ${title}`}</Button>} {...props}>
      <Drawer.Header>
        <Drawer.Close label={`Close ${title}`} />
        <Drawer.Title>{title}</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>{children}</Drawer.Body>
    </Drawer>
  );
}

/** Two drawers, the second opened from the first's body. */
const twoLayers = () => (
  <Layer title="Order">
    <Layer title="Customer" />
  </Layer>
);

describe("Drawer (web): slots", () => {
  it("lays the header out as back, text, Esc hint, close, whatever the order written", () => {
    render(
      <Drawer defaultOpen>
        <Drawer.Header>
          <Drawer.Close label="Close" />
          <Drawer.Title>Edit</Drawer.Title>
          <Drawer.Description>Change the order's details.</Drawer.Description>
          <Drawer.Back onPress={() => undefined} />
        </Drawer.Header>
        <Drawer.SubHeader>Tabs</Drawer.SubHeader>
        <Drawer.Body>Body</Drawer.Body>
        <Drawer.Footer>Footer</Drawer.Footer>
      </Drawer>,
    );
    const header = document.querySelector<HTMLElement>('[data-slot="drawer-header"]');
    const kids = [...(header?.children ?? [])];
    expect(kids[0]?.getAttribute("data-slot")).toBe("drawer-back");
    expect(kids[1]?.textContent).toBe("EditChange the order's details.");
    // One close control: the Escape key cap is the close button itself.
    expect(kids).toHaveLength(3);
    expect(kids[2]?.getAttribute("aria-label")).toBe("Close, Esc");
    expect(kids[2]?.textContent).toContain("esc");
    const order = [...(screen.getByRole("dialog").children ?? [])].map((el) =>
      el.getAttribute("data-slot"),
    );
    expect(order).toEqual(["drawer-header", "drawer-sub-header", "drawer-body", "drawer-footer"]);
  });

  it("draws the close control as `closeButton` asks, from the header or the Close", () => {
    const { unmount } = render(
      <Drawer defaultOpen>
        <Drawer.Header closeButton="icon">
          <Drawer.Title>Edit</Drawer.Title>
          <Drawer.Close label="Close" />
        </Drawer.Header>
      </Drawer>,
    );
    expect(screen.getByRole("button", { name: "Close" }).textContent).not.toContain("esc");
    unmount();
    const second = render(
      <Drawer defaultOpen>
        <Drawer.Header closeButton="icon">
          <Drawer.Title>Edit</Drawer.Title>
          <Drawer.Close label="Close" closeButton="both" />
        </Drawer.Header>
      </Drawer>,
    );
    expect(screen.getByRole("button", { name: "Close, Esc" }).textContent).toContain("esc");
    second.unmount();
    render(
      <Drawer defaultOpen>
        <Drawer.Header closeButton="none">
          <Drawer.Title>Edit</Drawer.Title>
          <Drawer.Close label="Close" />
        </Drawer.Header>
      </Drawer>,
    );
    expect(screen.queryByRole("button", { name: /Close/u })).toBeNull();
    expect(screen.getByRole("dialog").textContent).not.toContain("esc");
  });

  it("hides the Esc hint when Escape does not close the drawer, and draws no back button on one layer", () => {
    render(<Layer title="Order" defaultOpen isKeyboardDismissDisabled />);
    expect(screen.getByRole("dialog").textContent).not.toContain("esc");
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("floats inset at the md width by default, and takes `size` and `inset={false}`", () => {
    const { unmount } = render(<Layer title="Order" defaultOpen />);
    expect(screen.getByRole("dialog").className).toMatch(
      /w-\(--size-drawer-md\).*m-2.*rounded-\[var\(--radius-container\)\]/u,
    );
    unmount();
    render(<Layer title="Order" defaultOpen size="lg" inset={false} />);
    const className = screen.getByRole("dialog").className;
    expect(className).toContain("w-(--size-drawer-lg)");
    expect(className).not.toContain("m-2");
  });
});

describe("Drawer (web): stacking", () => {
  it("opens a second layer over the first, covering it, with a back button on top only", () => {
    render(twoLayers());
    press(screen.getByRole("button", { name: "Open Order" }));
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    press(screen.getByRole("button", { name: "Open Customer" }));
    const [order, customer] = dialogs();
    expect(order?.getAttribute("data-depth")).toBe("1");
    expect(order?.getAttribute("data-covered")).toBe("true");
    expect(customer?.getAttribute("data-depth")).toBe("2");
    expect(customer?.querySelector('[data-slot="drawer-back"]')).toBeTruthy();
  });

  it("closes only the top layer from Back, and uncovers the one under", () => {
    render(twoLayers());
    press(screen.getByRole("button", { name: "Open Order" }));
    press(screen.getByRole("button", { name: "Open Customer" }));
    const back = dialogs()[1]?.querySelector<HTMLElement>('[data-slot="drawer-back"]');
    if (!back) throw new Error("no back button");
    press(back);
    expect(dialogs()).toHaveLength(1);
    expect(dialogs()[0]?.hasAttribute("data-covered")).toBe(false);
  });

  it("closes only the top layer on Escape and gives focus back to its opener in the layer under", async () => {
    render(twoLayers());
    press(screen.getByRole("button", { name: "Open Order" }));
    const opener = screen.getByRole("button", { name: "Open Customer" });
    act(() => opener.focus());
    press(opener);
    const top = dialogs()[1];
    if (!top) throw new Error("no top layer");
    act(() => {
      fireEvent.keyDown(top, { key: "Escape" });
    });
    expect(dialogs()).toHaveLength(1);
    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });
    expect(document.activeElement).toBe(opener);
  });

  it("warns when a fourth drawer is stacked", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Layer title="One" defaultOpen>
        <Layer title="Two" defaultOpen>
          <Layer title="Three" defaultOpen>
            <Layer title="Four" defaultOpen />
          </Layer>
        </Layer>
      </Layer>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("4 drawers");
    warn.mockRestore();
  });
});

/** A view that pushes `to`. */
function Push({ to }: { readonly to: string }): ReactElement {
  const { push } = useViewStack();
  return <Button onPress={() => push(to)}>{`Go ${to}`}</Button>;
}

describe("Drawer (web): views", () => {
  it("shows Back on a pushed view, which pops it before it would close the drawer", () => {
    render(
      <Drawer defaultOpen label="Settings">
        <Drawer.ViewStack defaultView="list" transition="none">
          <Drawer.View id="list" label="List">
            <Drawer.Header>
              <Drawer.Title>List</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Push to="item" />
            </Drawer.Body>
          </Drawer.View>
          <Drawer.View id="item" label="Item">
            <Drawer.Header>
              <Drawer.Title>Item</Drawer.Title>
            </Drawer.Header>
          </Drawer.View>
        </Drawer.ViewStack>
      </Drawer>,
    );
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    press(screen.getByRole("button", { name: "Go item" }));
    expect(screen.getByRole("heading", { name: "Item" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "List" })).toBeTruthy();
    expect(dialogs()).toHaveLength(1);
  });
});
