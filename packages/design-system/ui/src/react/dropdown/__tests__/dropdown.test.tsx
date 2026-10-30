/**
 * Stackra file contract:
 * Purpose: proves the web `Dropdown` in the template's shape: the trigger opens the menu in its popover, each item
 *          shows its label and description, a plain-text label is its own text value, and choosing an item reports
 *          its key.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 2.5.3.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Dropdown } from "#react/dropdown/dropdown";

describe("Dropdown (web)", () => {
  beforeAll(() => {
    // jsdom has no layout, and the menu scrolls the focused item into view on an animation frame that can land after
    // the test, so the stub stays for the whole file (as in the menu test).
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("draws the trigger as a Button only when given a variant", () => {
    render(
      <>
        <Dropdown>
          <Dropdown.Trigger variant="secondary">Language</Dropdown.Trigger>
          <Dropdown.Menu aria-label="Languages">
            <Dropdown.Item id="en">English</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Dropdown>
          <Dropdown.Trigger className="row">Account</Dropdown.Trigger>
          <Dropdown.Menu aria-label="Account">
            <Dropdown.Item id="out">Sign out</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </>,
    );
    expect(screen.getByRole("button", { name: "Language" }).className).toMatch(/button--secondary/);
    const plain = screen.getByRole("button", { name: "Account" }).className;
    expect(plain).toMatch(/\brow\b/);
    expect(plain).not.toMatch(/button--/);
  });

  it("opens the menu and reports the chosen item", async () => {
    const onAction = vi.fn();
    render(
      <Dropdown>
        <Dropdown.Trigger aria-label="Switch tenant">Acme</Dropdown.Trigger>
        <Dropdown.Menu aria-label="Tenants" onAction={onAction}>
          <Dropdown.Item id="ten_1" description="Owner">
            Acme
          </Dropdown.Item>
          <Dropdown.Item id="sign-out" color="danger">
            Sign out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Switch tenant" }));
    const acme = await screen.findByRole("menuitem", { name: /Acme/ });
    expect(acme.textContent).toContain("Owner");
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeTruthy();
    fireEvent.click(acme);
    // React Aria passes the key first; a second argument it may add is not ours to pin
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction.mock.calls[0]?.[0]).toBe("ten_1");
  });
});
