/**
 * Stackra file contract:
 * Purpose: proves the web DropZone names its area and file input from `label`, disables them with `isDisabled`
 *          (the input through the native `disabled`), leaves HeroUI Pro's defaults when they are left out, passes
 *          unknown props through (`accept`, `multiple`, `onSelect`), carries HeroUI Pro's own parts and hook, and
 *          refuses HeroUI Pro's `aria-label` and `disabled`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-003
import {
  DropZone as HeroDropZone,
  useDropZonePickerContext as heroUseDropZonePickerContext,
} from "@heroui-pro/react/drop-zone";
import { fireEvent, render, screen } from "@testing-library/react";

import type { DropZoneAreaContractProps } from "#contracts/types/drop-zone-area-contract-props.type";
import type { DropZoneInputContractProps } from "#contracts/types/drop-zone-input-contract-props.type";
import { DropZone, useDropZonePickerContext } from "#react/drop-zone/drop-zone";
import type { DropZoneAreaProps } from "#react/drop-zone/drop-zone-area.props";
import type { DropZoneInputProps } from "#react/drop-zone/drop-zone-input.props";

interface ZoneOptions {
  readonly area?: Omit<DropZoneAreaProps, "children">;
  readonly input?: DropZoneInputProps;
}

function Zone({ area, input }: ZoneOptions) {
  return (
    <DropZone data-testid="root" className="extra">
      <DropZone.Area data-testid="area" {...area}>
        <DropZone.Label>Drop files here</DropZone.Label>
        <DropZone.Description>PDF up to 10 MB</DropZone.Description>
        <DropZone.Trigger>Select files</DropZone.Trigger>
      </DropZone.Area>
      <DropZone.Input data-testid="input" {...input} />
    </DropZone>
  );
}

describe("DropZone (web)", () => {
  it("names the area from label", () => {
    render(<Zone area={{ label: "Upload area" }} />);
    expect(screen.getByLabelText("Upload area")).toBeTruthy();
  });

  it("names the file input from label", () => {
    render(<Zone input={{ label: "Choose files" }} />);
    expect(screen.getByTestId("input").getAttribute("aria-label")).toBe("Choose files");
  });

  it("disables the area with isDisabled, and leaves it enabled when nothing is given", () => {
    const { rerender } = render(<Zone area={{ isDisabled: true }} />);
    expect(screen.getByTestId("area").hasAttribute("data-disabled")).toBe(true);
    rerender(<Zone />);
    expect(screen.getByTestId("area").hasAttribute("data-disabled")).toBe(false);
  });

  it("maps isDisabled on the input to the native disabled attribute", () => {
    const { rerender } = render(<Zone input={{ isDisabled: true }} />);
    expect((screen.getByTestId("input") as HTMLInputElement).disabled).toBe(true);
    rerender(<Zone />);
    expect((screen.getByTestId("input") as HTMLInputElement).disabled).toBe(false);
  });

  it("passes unknown props through to HeroUI Pro, and hands the chosen files to onSelect", () => {
    const onSelect = vi.fn();
    render(<Zone input={{ accept: ".pdf", multiple: true, onSelect }} />);
    const input = screen.getByTestId("input") as HTMLInputElement;
    expect(input.accept).toBe(".pdf");
    expect(input.multiple).toBe(true);
    expect(screen.getByTestId("root").classList.contains("extra")).toBe(true);
    const file = new File(["x"], "a.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it.each([
    "Icon",
    "Label",
    "Description",
    "Trigger",
    "FileList",
    "FileItem",
    "FileFormatIcon",
    "FileInfo",
    "FileName",
    "FileMeta",
    "FileProgress",
    "FileProgressTrack",
    "FileProgressFill",
    "FileRetryTrigger",
    "FileRemoveTrigger",
  ] as const)("carries HeroUI Pro's own %s", (name) => {
    expect(DropZone[name]).toBe(HeroDropZone[name]);
  });

  it("re-exports HeroUI Pro's picker hook", () => {
    expect(useDropZonePickerContext).toBe(heroUseDropZonePickerContext);
  });

  it("extends its contracts and refuses the names the contracts own", () => {
    expectTypeOf<DropZoneAreaProps>().toExtend<DropZoneAreaContractProps>();
    expectTypeOf<DropZoneAreaProps>().not.toHaveProperty("aria-label");
    expectTypeOf<DropZoneInputProps>().toExtend<DropZoneInputContractProps>();
    expectTypeOf<DropZoneInputProps>().not.toHaveProperty("disabled");
    expectTypeOf<DropZoneInputProps>().not.toHaveProperty("aria-label");
  });
});
