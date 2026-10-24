/**
 * Stackra file contract:
 * Purpose: proves the web NativeSelect maps `isFullWidth` on the root and `label` and `isDisabled` on the trigger,
 *          leaves HeroUI Pro's defaults when they are left out, passes unknown props through, carries HeroUI Pro's
 *          own parts, and refuses HeroUI Pro's `fullWidth` and `disabled`.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import { NativeSelect as HeroNativeSelect } from "@heroui-pro/react/native-select";
import { render, screen } from "@testing-library/react";

import type {
  NativeSelectContractProps,
  NativeSelectTriggerContractProps,
} from "#contracts/types/native-select-contract-props.type";
import { NativeSelect, type NativeSelectProps } from "#react/native-select/native-select";
import type { NativeSelectTriggerProps } from "#react/native-select/native-select-trigger";

interface SelectOptions {
  readonly root?: Omit<NativeSelectProps, "children">;
  readonly trigger?: Omit<NativeSelectTriggerProps, "children">;
}

function Select({ root, trigger }: SelectOptions) {
  return (
    <NativeSelect data-testid="root" {...root}>
      <NativeSelect.Trigger {...trigger}>
        <NativeSelect.OptGroup label="Europe">
          <NativeSelect.Option value="fr">France</NativeSelect.Option>
          <NativeSelect.Option value="de">Germany</NativeSelect.Option>
        </NativeSelect.OptGroup>
      </NativeSelect.Trigger>
      <NativeSelect.Indicator />
    </NativeSelect>
  );
}

describe("NativeSelect (web)", () => {
  it("maps isFullWidth to HeroUI Pro's fullWidth, and leaves its default when nothing is given", () => {
    const { rerender } = render(<Select root={{ isFullWidth: true }} />);
    const full = screen.getByTestId("root").className;
    rerender(<Select />);
    expect(screen.getByTestId("root").className).not.toBe(full);
  });

  it("names the select from label", () => {
    render(<Select trigger={{ label: "Country" }} />);
    expect(screen.getByRole("combobox", { name: "Country" })).toBeTruthy();
  });

  it("maps isDisabled to the native disabled attribute, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Select trigger={{ isDisabled: true }} />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
    rerender(<Select />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro", () => {
    render(
      <Select
        root={{ variant: "secondary", id: "r" }}
        trigger={{ defaultValue: "de", name: "country" }}
      />,
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("de");
    expect(select.name).toBe("country");
    expect(screen.getByTestId("root").id).toBe("r");
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(NativeSelect.Indicator).toBe(HeroNativeSelect.Indicator);
    expect(NativeSelect.Option).toBe(HeroNativeSelect.Option);
    expect(NativeSelect.OptGroup).toBe(HeroNativeSelect.OptGroup);
  });

  it("extends its contracts and refuses the names the contracts own", () => {
    expectTypeOf<NativeSelectProps>().toExtend<NativeSelectContractProps>();
    expectTypeOf<NativeSelectProps>().not.toHaveProperty("fullWidth");
    expectTypeOf<NativeSelectTriggerProps>().toExtend<NativeSelectTriggerContractProps>();
    expectTypeOf<NativeSelectTriggerProps>().not.toHaveProperty("disabled");
    expectTypeOf<NativeSelectTriggerProps>().not.toHaveProperty("aria-label");
  });
});
