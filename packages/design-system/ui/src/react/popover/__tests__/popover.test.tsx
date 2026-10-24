/**
 * Stackra file contract:
 * Purpose: proves the web Popover opens on its trigger as a dialog named by its title or its aria-label, draws the
 *          arrow only when asked, closes on Escape unless `isKeyboardDismissDisabled`, runs controlled and uncontrolled
 *          and reports each change, hands HeroUI's pass-through props on, and that the type refuses a physical side and
 *          a missing trigger.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded and nothing is laid out, so where the
 *           popover lands is checked by the playground's e2e suite, and so is a press outside it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.1.2, 4.1.2; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-110
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { PopoverContractProps } from "#contracts/types/popover-contract-props.type";
import { Button } from "#react/button/button";
import { Popover, type PopoverProps } from "#react/popover/popover";

const press = (element: HTMLElement) => act(() => element.click());
const trigger = <Button>Filters</Button>;

describe("Popover (web)", () => {
  it("opens a dialog named by its title when the trigger is pressed", () => {
    render(
      <Popover trigger={trigger} title="Filter orders">
        Choose a status.
      </Popover>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    press(screen.getByRole("button", { name: "Filters" }));
    const dialog = screen.getByRole("dialog", { name: "Filter orders" });
    expect(dialog.textContent).toContain("Choose a status.");
    expect(screen.getByRole("heading", { level: 2, name: "Filter orders" })).toBeTruthy();
  });

  it("is named by aria-label when there is no title", () => {
    render(
      <Popover trigger={trigger} aria-label="Order filters">
        Choose a status.
      </Popover>,
    );
    press(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("dialog", { name: "Order filters" })).toBeTruthy();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("marks the trigger as expanded while the popover is open", () => {
    render(
      <Popover trigger={trigger} title="Filter orders">
        Choose a status.
      </Popover>,
    );
    const button = screen.getByRole("button", { name: "Filters" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    press(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("draws the arrow only when asked", () => {
    const { rerender } = render(
      <Popover trigger={trigger} title="Filter orders" defaultOpen>
        Choose a status.
      </Popover>,
    );
    expect(document.querySelector('[data-slot="popover-overlay-arrow"]')).toBeNull();
    rerender(
      <Popover trigger={trigger} title="Filter orders" defaultOpen hasArrow>
        Choose a status.
      </Popover>,
    );
    expect(document.querySelector('[data-slot="popover-overlay-arrow"]')).toBeTruthy();
  });

  it("closes on Escape and says so", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover trigger={trigger} title="Filter orders" onOpenChange={onOpenChange}>
        Choose a status.
      </Popover>,
    );
    press(screen.getByRole("button", { name: "Filters" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("stays open on Escape while isKeyboardDismissDisabled", () => {
    render(
      <Popover trigger={trigger} title="Filter orders" isKeyboardDismissDisabled defaultOpen>
        Choose a status.
      </Popover>,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("starts open with defaultOpen", () => {
    render(
      <Popover trigger={trigger} title="Filter orders" defaultOpen>
        Choose a status.
      </Popover>,
    );
    expect(screen.getByRole("dialog", { name: "Filter orders" })).toBeTruthy();
  });

  it("follows isOpen when controlled, and asks the app to change it", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Popover trigger={trigger} title="Filter orders" isOpen={false} onOpenChange={onOpenChange}>
        Choose a status.
      </Popover>,
    );
    press(screen.getByRole("button", { name: "Filters" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <Popover trigger={trigger} title="Filter orders" isOpen onOpenChange={onOpenChange}>
        Choose a status.
      </Popover>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("passes HeroUI's content props and the class name through", () => {
    render(
      <Popover trigger={trigger} title="Filter orders" defaultOpen className="max-w-72" offset={12}>
        Choose a status.
      </Popover>,
    );
    const surface = screen.getByRole("dialog").parentElement;
    expect(surface?.className).toContain("max-w-72");
  });

  it("refuses a physical side, a missing trigger and the raw HeroUI non-modal flag", () => {
    expectTypeOf<PopoverProps>().toExtend<PopoverContractProps>();
    // @ts-expect-error placement is by reading direction, so `left` is not a side
    const wrongSide: PopoverProps["placement"] = "left";
    // @ts-expect-error a popover has to be opened by something
    const noTrigger: PopoverProps = { children: "x" };
    // @ts-expect-error dismissal is the contract's isDismissable
    const rawFlag: PopoverProps = { trigger, children: "x", isNonModal: true };
    void [wrongSide, noTrigger, rawFlag];
  });
});
