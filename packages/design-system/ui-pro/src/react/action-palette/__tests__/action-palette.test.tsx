/**
 * Stackra file contract:
 * Purpose: proves the web ActionPalette names its dialog and search field from `label` (and keeps HeroUI Pro's
 *          defaults without it), filters its items by the search input, passes unknown props through, carries
 *          HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-004
import { Command as HeroCommand } from "@heroui-pro/react/command";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ActionPalette, type ActionPaletteProps } from "#react/action-palette/action-palette";
import type { ActionPaletteDialogProps } from "#react/action-palette/action-palette-dialog";
import type { ActionPaletteInputGroupProps } from "#react/action-palette/action-palette-input-group";

interface PaletteLabels {
  readonly dialog?: string;
  readonly search?: string;
}

function Palette({ dialog, search }: PaletteLabels) {
  return (
    <ActionPalette>
      <ActionPalette.Backdrop isOpen>
        <ActionPalette.Container size="lg" data-testid="container">
          <ActionPalette.Dialog {...(dialog ? { label: dialog } : {})} data-testid="dialog">
            <ActionPalette.InputGroup {...(search ? { label: search } : {})}>
              <ActionPalette.InputGroup.Prefix>?</ActionPalette.InputGroup.Prefix>
              <ActionPalette.InputGroup.Input placeholder="Type an action" />
              <ActionPalette.InputGroup.ClearButton />
              <ActionPalette.InputGroup.Suffix>esc</ActionPalette.InputGroup.Suffix>
            </ActionPalette.InputGroup>
            <ActionPalette.List aria-label="Actions">
              <ActionPalette.Group heading="Files">
                <ActionPalette.Item id="new" textValue="Create file">
                  Create file
                </ActionPalette.Item>
                <ActionPalette.Item id="open" textValue="Open folder">
                  Open folder
                </ActionPalette.Item>
              </ActionPalette.Group>
              <ActionPalette.Separator />
            </ActionPalette.List>
            <ActionPalette.Footer>Enter to select</ActionPalette.Footer>
          </ActionPalette.Dialog>
        </ActionPalette.Container>
      </ActionPalette.Backdrop>
    </ActionPalette>
  );
}

describe("ActionPalette (web)", () => {
  it("takes the names of its dialog and search field from label", () => {
    render(<Palette dialog="Quick actions" search="Search actions" />);
    expect(screen.getByRole("dialog", { name: "Quick actions" })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search actions" })).toBeTruthy();
  });

  it("keeps HeroUI Pro's default names when label is left out", () => {
    render(<Palette />);
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "Search commands" })).toBeTruthy();
  });

  it("filters its items by the search input, in the groups and parts HeroUI Pro draws", () => {
    render(<Palette />);
    expect(screen.getByText("Files")).toBeTruthy();
    expect(screen.getByText("Enter to select")).toBeTruthy();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    act(() => {
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "folder" } });
    });
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
    expect(screen.getByRole("menuitem", { name: "Open folder" })).toBeTruthy();
  });

  it("passes unknown props through to HeroUI Pro's parts", () => {
    render(<Palette />);
    expect(screen.getByTestId("dialog")).toBeTruthy();
    expect(screen.getByTestId("container")).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(ActionPalette.Backdrop).toBe(HeroCommand.Backdrop);
    expect(ActionPalette.Container).toBe(HeroCommand.Container);
    expect(ActionPalette.Header).toBe(HeroCommand.Header);
    expect(ActionPalette.List).toBe(HeroCommand.List);
    expect(ActionPalette.Item).toBe(HeroCommand.Item);
    expect(ActionPalette.Group).toBe(HeroCommand.Group);
    expect(ActionPalette.Separator).toBe(HeroCommand.Separator);
    expect(ActionPalette.Footer).toBe(HeroCommand.Footer);
    expect(ActionPalette.InputGroup.Prefix).toBe(HeroCommand.InputGroup.Prefix);
    expect(ActionPalette.InputGroup.Input).toBe(HeroCommand.InputGroup.Input);
    expect(ActionPalette.InputGroup.ClearButton).toBe(HeroCommand.InputGroup.ClearButton);
    expect(ActionPalette.InputGroup.Suffix).toBe(HeroCommand.InputGroup.Suffix);
  });

  it("types the accessible name as label", () => {
    expectTypeOf<ActionPaletteProps>().toHaveProperty("children");
    expectTypeOf<ActionPaletteDialogProps>().toHaveProperty("label");
    expectTypeOf<ActionPaletteInputGroupProps>().toHaveProperty("label");
  });
});
