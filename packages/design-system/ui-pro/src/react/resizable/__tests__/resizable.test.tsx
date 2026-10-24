/**
 * Stackra file contract:
 * Purpose: proves the web Resizable names its handle from `label`, maps `isDisabled` to HeroUI Pro's `disabled`,
 *          passes the root's own props and unknown props through, carries HeroUI Pro's own Panel and Indicator, and
 *          refuses HeroUI Pro's `aria-label` and `disabled`.
 * Boundary: jsdom with real HeroUI Pro and react-resizable-panels; `ResizeObserver` is stubbed because jsdom has none
 *          and the panel group measures its box through it. Drag and keyboard resizing need a layout engine and are
 *          not driven; the theme CSS is not loaded, so attributes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-004
import { Resizable as HeroResizable } from "@heroui-pro/react/resizable";
import { render, screen } from "@testing-library/react";

import { Resizable, type ResizableHandleProps } from "#react/resizable/resizable";

/** The handle's markup without its generated id, which differs on every render. */
const handleHtml = () => screen.getByRole("separator").outerHTML.replace(/ id="[^"]*"/, "");

/** Two panels around one handle, the handle's props left to the caller. */
function Example(props: Partial<ResizableHandleProps>) {
  return (
    <Resizable orientation="horizontal" data-testid="group" className="extra">
      <Resizable.Panel id="side" defaultSize={30}>
        Sidebar
      </Resizable.Panel>
      <Resizable.Handle {...props} />
      <Resizable.Panel id="main">Main</Resizable.Panel>
    </Resizable>
  );
}

describe("Resizable (web)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("draws the panels and passes the root's unknown props through", () => {
    render(<Example />);
    const group = screen.getByTestId("group");
    expect(group.classList.contains("extra")).toBe(true);
    expect(screen.getByText("Sidebar")).toBeTruthy();
    expect(screen.getByText("Main")).toBeTruthy();
  });

  it("names the handle from label", () => {
    render(<Example label="Resize sidebar" />);
    expect(screen.getByRole("separator", { name: "Resize sidebar" })).toBeTruthy();
  });

  it("maps isDisabled to HeroUI Pro's disabled, and leaves the handle enabled without it", () => {
    const { rerender } = render(<Example isDisabled label="Resize sidebar" />);
    const disabled = handleHtml();
    rerender(<Example label="Resize sidebar" />);
    const enabled = handleHtml();
    expect(disabled).not.toBe(enabled);
    rerender(
      <HeroResizable orientation="horizontal" data-testid="group" className="extra">
        <HeroResizable.Panel id="side" defaultSize={30}>
          Sidebar
        </HeroResizable.Panel>
        <HeroResizable.Handle disabled aria-label="Resize sidebar" />
        <HeroResizable.Panel id="main">Main</HeroResizable.Panel>
      </HeroResizable>,
    );
    expect(handleHtml()).toBe(disabled);
  });

  it("passes HeroUI Pro's handle props through", () => {
    render(<Example label="Resize" type="pill" />);
    expect(screen.getByRole("separator", { name: "Resize" })).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(Resizable.Panel).toBe(HeroResizable.Panel);
    expect(Resizable.Indicator).toBe(HeroResizable.Indicator);
  });

  it("refuses HeroUI Pro's names for the accessible name and the disabled state", () => {
    expectTypeOf<ResizableHandleProps>().toHaveProperty("label");
    expectTypeOf<ResizableHandleProps>().toHaveProperty("isDisabled");
    // `aria-label` is a hyphenated attribute, which JSX does not type-check: the type itself is asserted.
    expectTypeOf<ResizableHandleProps>().not.toHaveProperty("aria-label");
    // @ts-expect-error `isDisabled` is the one name for the disabled state
    void (<Resizable.Handle disabled />);
  });
});
