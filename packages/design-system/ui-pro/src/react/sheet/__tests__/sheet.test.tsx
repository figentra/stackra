/**
 * Stackra file contract:
 * Purpose: proves the web Sheet names its dialog from `label`, passes the root's own props (`isOpen`, `placement`)
 *          and unknown props through, carries HeroUI Pro's own parts, and refuses HeroUI Pro's `aria-label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither and HeroUI Pro's Sheet code reads them; the theme CSS is not loaded, so roles and names are checked,
 *          not looks. The sheet's open and close animation and its drag are not driven.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { Sheet as HeroSheet } from "@heroui-pro/react/sheet";
import { render, screen } from "@testing-library/react";

import { Sheet } from "#react/sheet/sheet";
import type { SheetDialogProps } from "#react/sheet/sheet-dialog.props";
import type { SheetProps } from "#react/sheet/sheet.props";

// jsdom has neither `matchMedia` nor `ResizeObserver`. HeroUI Pro's Sheet reads `matchMedia` as its module loads, so the
// stubs also exist before any import; the config restores stubbed globals after each test, so `beforeEach` stubs again.
function stubBrowserApis() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}

      unobserve() {}

      disconnect() {}
    },
  );
}
vi.hoisted(() => stubBrowserApis());

beforeEach(() => stubBrowserApis());

/** An open sheet whose dialog carries what the caller passes. */
function Example(props: { readonly label?: string; readonly isOpen?: boolean }) {
  const { label, isOpen = true } = props;
  return (
    <Sheet isOpen={isOpen}>
      <Sheet.Backdrop>
        <Sheet.Content>
          <Sheet.Dialog {...(label === undefined ? {} : { label })} data-testid="dialog">
            <Sheet.Body>Filters</Sheet.Body>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}

describe("Sheet (web)", () => {
  it("names the dialog from label", () => {
    render(<Example label="Filters" />);
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toBe(screen.getByTestId("dialog"));
    expect(dialog.textContent).toContain("Filters");
  });

  it("leaves the dialog unnamed when label is left out", () => {
    render(<Example />);
    expect(screen.getByTestId("dialog").hasAttribute("aria-label")).toBe(false);
  });

  it("passes the root's own props through: a closed sheet draws no dialog", () => {
    render(<Example isOpen={false} label="Filters" />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Trigger",
      "Close",
      "Backdrop",
      "Content",
      "Header",
      "Heading",
      "Body",
      "Footer",
      "Handle",
      "CloseTrigger",
      "NestedRoot",
    ] as const) {
      expect(Sheet[part]).toBe(HeroSheet[part]);
    }
  });

  it("refuses HeroUI Pro's aria-label on the dialog", () => {
    expectTypeOf<SheetProps>().toHaveProperty("children");
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<SheetDialogProps>().not.toHaveProperty("aria-label");
  });
});
