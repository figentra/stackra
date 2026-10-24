/**
 * Stackra file contract:
 * Purpose: proves the web InlineSelect names the select from `label`, disables it with `isDisabled`, leaves HeroUI
 *          Pro's defaults when they are left out, passes unknown props through (`defaultValue` selects an item),
 *          carries HeroUI Pro's own parts, and types the accessible name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { ListBox } from "@heroui/react";
import { InlineSelect as HeroInlineSelect } from "@heroui-pro/react/inline-select";
import { render, screen } from "@testing-library/react";

import type { InlineSelectContractProps } from "#contracts/types/inline-select-contract-props.type";
import { InlineSelect, type InlineSelectProps } from "#react/inline-select/inline-select";

function Inline(props: Omit<InlineSelectProps, "children">) {
  return (
    <InlineSelect {...props}>
      <InlineSelect.Trigger>
        <InlineSelect.Value />
        <InlineSelect.Indicator />
      </InlineSelect.Trigger>
      <InlineSelect.Popover>
        <ListBox>
          <ListBox.Item id="en" textValue="English">
            English
          </ListBox.Item>
          <ListBox.Item id="es" textValue="Spanish">
            Spanish
          </ListBox.Item>
        </ListBox>
      </InlineSelect.Popover>
    </InlineSelect>
  );
}

describe("InlineSelect (web)", () => {
  it("names the select from label", () => {
    render(<Inline label="Language" />);
    expect(screen.getByRole("button", { name: /Language/ })).toBeTruthy();
  });

  it("disables the trigger with isDisabled, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Inline isDisabled />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    rerender(<Inline />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(<Inline defaultValue="es" data-testid="inline" />);
    expect(screen.getByTestId("inline")).toBeTruthy();
    expect(screen.getByRole("button").textContent).toContain("Spanish");
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(InlineSelect.Trigger).toBe(HeroInlineSelect.Trigger);
    expect(InlineSelect.Value).toBe(HeroInlineSelect.Value);
    expect(InlineSelect.Indicator).toBe(HeroInlineSelect.Indicator);
    expect(InlineSelect.Popover).toBe(HeroInlineSelect.Popover);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<InlineSelectProps>().toExtend<InlineSelectContractProps>();
    expectTypeOf<InlineSelectProps>().not.toHaveProperty("aria-label");
  });
});
